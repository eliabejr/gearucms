import type { TRPCError } from "@trpc/server"
import type { TRPCRouterRecord } from "@trpc/server"
import { and, desc, eq, gte, sql } from "drizzle-orm"
import { z } from "zod"
import {
	aiJobItems,
	aiJobs,
	aiUsageLog,
	collectionFields,
	collectionRedirects,
	collections,
	comments,
	entries,
	entryFields,
	entryRedirects,
	entryVersions,
	media,
	siteSettings,
	trackingScripts,
} from "../schema/index"
import { isPublicSettingKey, sanitizeComment, slugify } from "../security"

const fieldTypeEnum = z.enum(["text", "richtext", "number", "boolean", "image", "relation", "date"])
const relationConfigSchema = z.object({
	targetCollectionId: z.number().int().positive(),
	multiple: z.boolean().default(false),
})
const fieldConfigSchema = z.object({
	relation: relationConfigSchema.optional(),
}).optional()
const requiredText = (label: string) => z.string().trim().min(1, `${label} is required`)

export interface GearuMediaRecord {
	id: number
	filename: string
	originalName: string
	url: string
	size: number
	mimeType: string
	width?: number | null
	height?: number | null
	altText?: string | null
	caption?: string | null
	focalX?: number | null
	focalY?: number | null
	variants?: string | null
}

export interface GearuStorageAdapter {
	delete(record: GearuMediaRecord): Promise<void>
}

export interface GearuEntryLifecycleEvent {
	entry: Record<string, unknown>
	collection: Record<string, unknown>
	url: string
	previousSlug?: string
}

export interface GearuLifecycleHooks {
	onEntryPublished?: (event: GearuEntryLifecycleEvent) => Promise<void> | void
	onEntryUpdated?: (event: GearuEntryLifecycleEvent) => Promise<void> | void
	onEntrySlugChanged?: (event: GearuEntryLifecycleEvent) => Promise<void> | void
}

export interface GearuCommentPolicy {
	/** Require an authenticated, email-verified user before accepting a comment. */
	requireVerifiedMember?: boolean
	sanitize?: (content: string) => string
	/** Return a pre-hashed identifier. Raw IP addresses must never be persisted. */
	getRateLimitKey?: (request: { headers?: Headers; userId?: string }) => Promise<string | null> | string | null
	checkRateLimit?: (key: string) => Promise<boolean> | boolean
	scoreSpam?: (comment: { content: string; authorName: string; authorEmail: string }) => Promise<number> | number
	spamThreshold?: number
}

export interface CreateGearuRouterContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	publicProcedure: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protectedProcedure: any
	TRPCError?: typeof TRPCError
	siteUrl?: string
	storage?: GearuStorageAdapter
	lifecycle?: GearuLifecycleHooks
	comments?: GearuCommentPolicy
	/** Schedule post-response work in Workers, or omit to await hooks inline. */
	waitUntil?: (promise: Promise<void>) => void
	isPublicSettingAllowed?: (key: string) => boolean
	isTrackingScriptAllowed?: (script: { id: number; name: string; location: string }) => boolean
}

function encodeFieldConfig(config: z.infer<typeof fieldConfigSchema>): string | null {
	return config ? JSON.stringify(config) : null
}

function schedule(ctx: CreateGearuRouterContext, work: Promise<void>): Promise<void> {
	if (ctx.waitUntil) {
		ctx.waitUntil(work)
		return Promise.resolve()
	}
	return work
}

function forbidden(ctx: CreateGearuRouterContext, message: string): Error {
	const ErrorConstructor = ctx.TRPCError
	if (ErrorConstructor) return new ErrorConstructor({ code: "FORBIDDEN", message })
	return new Error(message)
}

function tooManyRequests(ctx: CreateGearuRouterContext): Error {
	const ErrorConstructor = ctx.TRPCError
	if (ErrorConstructor) return new ErrorConstructor({ code: "TOO_MANY_REQUESTS", message: "Too many comments" })
	return new Error("Too many comments")
}

export function createCollectionsRouter(ctx: CreateGearuRouterContext) {
	const { db, publicProcedure, protectedProcedure } = ctx

	return {
		list: protectedProcedure.query(async () => {
			return db.query.collections.findMany({
				with: { fields: true, entries: true },
				orderBy: (table: typeof collections, helpers: { desc: typeof desc }) => [helpers.desc(table.createdAt)],
			})
		}),

		getById: protectedProcedure.input(z.object({ id: z.number() })).query(async (opts: { input: { id: number } }) => {
			return db.query.collections.findFirst({
				where: eq(collections.id, opts.input.id),
				with: {
					fields: { orderBy: (table: typeof collectionFields, helpers: { asc: (value: unknown) => unknown[] | unknown }) => [helpers.asc(table.sortOrder)] },
				},
			})
		}),

		create: protectedProcedure
			.input(z.object({
				name: requiredText("Collection name"),
				slug: z.string().trim().optional(),
				description: z.string().trim().optional(),
			}))
			.mutation(async (opts: { input: { name: string; slug?: string; description?: string } }) => {
				const name = opts.input.name.trim()
				const slug = opts.input.slug?.trim() || slugify(name)
				const description = opts.input.description?.trim() || undefined
				const [collection] = await db
					.insert(collections)
					.values({ name, slug, description })
					.returning()
				return collection
			}),

		update: protectedProcedure
			.input(z.object({
				id: z.number(),
				name: requiredText("Collection name").optional(),
				slug: z.string().trim().optional(),
				description: z.string().trim().optional(),
			}))
			.mutation(async (opts: { input: { id: number; name?: string; slug?: string; description?: string } }) => {
				const { id, ...data } = opts.input
				const current = await db.query.collections.findFirst({ where: eq(collections.id, id) })
				const [collection] = await db
					.update(collections)
					.set({
						...data,
						name: data.name?.trim(),
						slug: data.slug?.trim(),
						description: data.description?.trim() || undefined,
					})
					.where(eq(collections.id, id))
					.returning()
				if (current && collection && current.slug !== collection.slug) {
					await db.insert(collectionRedirects).values({
						collectionId: id,
						oldSlug: current.slug,
						newSlug: collection.slug,
					})
				}
				return collection
			}),

		resolveRedirect: publicProcedure
			.input(z.object({ slug: z.string() }))
			.query(async (opts: { input: { slug: string } }) => {
				return db.query.collectionRedirects.findFirst({
					where: eq(collectionRedirects.oldSlug, opts.input.slug),
					orderBy: (table: typeof collectionRedirects, helpers: { desc: typeof desc }) => [
						helpers.desc(table.createdAt),
					],
				})
			}),

		delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			await db.delete(collections).where(eq(collections.id, opts.input.id))
			return { success: true }
		}),

		addField: protectedProcedure
			.input(z.object({
				collectionId: z.number(),
				name: requiredText("Field name"),
				slug: z.string().trim().optional(),
				type: fieldTypeEnum,
				required: z.boolean().default(false),
				config: fieldConfigSchema,
			}))
			.mutation(async (opts: { input: { collectionId: number; name: string; slug?: string; type: z.infer<typeof fieldTypeEnum>; required: boolean; config?: z.infer<typeof fieldConfigSchema> } }) => {
				const name = opts.input.name.trim()
				const slug = opts.input.slug?.trim() || slugify(name)
				const existing = await db.query.collectionFields.findMany({
					where: eq(collectionFields.collectionId, opts.input.collectionId),
				})
				const [field] = await db
					.insert(collectionFields)
					.values({
						collectionId: opts.input.collectionId,
						name,
						slug,
						type: opts.input.type,
						required: opts.input.required,
						sortOrder: existing.length,
						config: encodeFieldConfig(opts.input.config),
					})
					.returning()
				return field
			}),

		updateField: protectedProcedure
			.input(z.object({
				id: z.number(),
				name: requiredText("Field name").optional(),
				slug: z.string().trim().optional(),
				type: fieldTypeEnum.optional(),
				required: z.boolean().optional(),
				config: fieldConfigSchema,
			}))
			.mutation(async (opts: { input: { id: number; name?: string; slug?: string; type?: z.infer<typeof fieldTypeEnum>; required?: boolean; config?: z.infer<typeof fieldConfigSchema> } }) => {
				const { id, config, ...data } = opts.input
				const [field] = await db
					.update(collectionFields)
					.set({
						...data,
						name: data.name?.trim(),
						slug: data.slug?.trim(),
						...(config !== undefined ? { config: encodeFieldConfig(config) } : {}),
					})
					.where(eq(collectionFields.id, id))
					.returning()
				return field
			}),

		removeField: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			await db.delete(collectionFields).where(eq(collectionFields.id, opts.input.id))
			return { success: true }
		}),

		reorderFields: protectedProcedure
			.input(z.array(z.object({ id: z.number(), sortOrder: z.number() })))
			.mutation(async (opts: { input: Array<{ id: number; sortOrder: number }> }) => {
				for (const item of opts.input) {
					await db.update(collectionFields).set({ sortOrder: item.sortOrder }).where(eq(collectionFields.id, item.id))
				}
				return { success: true }
			}),
	} satisfies TRPCRouterRecord
}

async function createVersion(db: CreateGearuRouterContext["db"], entryId: number, createdBy?: string) {
	const currentMax = await db
		.select({ max: sql<number>`COALESCE(MAX(${entryVersions.versionNumber}), 0)` })
		.from(entryVersions)
		.where(eq(entryVersions.entryId, entryId))

	const newVersion = (currentMax[0]?.max ?? 0) + 1
	const fieldValues = await db.select().from(entryFields).where(eq(entryFields.entryId, entryId))
	const snapshot = JSON.stringify(fieldValues.map((field: { fieldId: number; value: string | null }) => ({ fieldId: field.fieldId, value: field.value })))

	await db.insert(entryVersions).values({
		entryId,
		versionNumber: newVersion,
		dataSnapshot: snapshot,
		createdBy,
	})
}

function makeEntryUrl(
	ctx: CreateGearuRouterContext,
	collectionSlug: string,
	entrySlug: string,
): string {
	const base = (ctx.siteUrl ?? "").replace(/\/$/, "")
	return `${base}/${collectionSlug}/${entrySlug}`
}

async function runEntryHook(
	ctx: CreateGearuRouterContext,
	hook: keyof GearuLifecycleHooks,
	event: GearuEntryLifecycleEvent,
): Promise<void> {
	const callback = ctx.lifecycle?.[hook]
	if (!callback) return
	await schedule(ctx, Promise.resolve(callback(event)))
}

export function createEntriesRouter(ctx: CreateGearuRouterContext) {
	const { db, publicProcedure, protectedProcedure } = ctx

	return {
		list: protectedProcedure
			.input(
				z
					.object({
						collectionId: z.number().optional(),
						status: z.enum(["draft", "published", "archived"]).optional(),
						limit: z.number().default(50),
						offset: z.number().default(0),
					})
					.optional(),
			)
			.query(async (opts: { input?: { collectionId?: number; status?: "draft" | "published" | "archived"; limit?: number; offset?: number } }) => {
				const filters = opts.input ?? {}
				let query = db
					.select()
					.from(entries)
					.leftJoin(collections, eq(entries.collectionId, collections.id))
					.orderBy(desc(entries.updatedAt))
					.limit(filters.limit ?? 50)
					.offset(filters.offset ?? 0)

				if (filters.collectionId) {
					query = query.where(eq(entries.collectionId, filters.collectionId)) as typeof query
				}
				if (filters.status) {
					query = query.where(eq(entries.status, filters.status)) as typeof query
				}

				const results = await query
				return results.map((result: { entries: unknown; collections: unknown }) => ({
					...(result.entries as object),
					collection: result.collections,
				}))
			}),

		getById: protectedProcedure.input(z.object({ id: z.number() })).query(async (opts: { input: { id: number } }) => {
			return db.query.entries.findFirst({
				where: eq(entries.id, opts.input.id),
				with: {
					fields: { with: { field: true } },
					collection: { with: { fields: true } },
				},
			})
		}),

		getBySlug: publicProcedure
			.input(z.object({ collectionSlug: z.string(), entrySlug: z.string() }))
			.query(async (opts: { input: { collectionSlug: string; entrySlug: string } }) => {
				const collection = await db.query.collections.findFirst({
					where: eq(collections.slug, opts.input.collectionSlug),
				})
				if (!collection) return null

				return db.query.entries.findFirst({
					where: and(
						eq(entries.collectionId, collection.id),
						eq(entries.slug, opts.input.entrySlug),
						eq(entries.status, "published"),
					),
					with: {
						fields: { with: { field: true } },
						collection: true,
					},
				})
			}),

		create: protectedProcedure
			.input(
				z.object({
					collectionId: z.number(),
					title: z.string().min(1),
					slug: z.string().optional(),
					status: z.enum(["draft", "published"]).default("draft"),
					metaTitle: z.string().optional(),
					metaDescription: z.string().optional(),
					ogImage: z.string().optional(),
					fields: z.array(z.object({ fieldId: z.number(), value: z.string().nullable() })),
				}),
			)
			.mutation(async (opts: {
				input: {
					collectionId: number
					title: string
					slug?: string
					status: "draft" | "published"
					metaTitle?: string
					metaDescription?: string
					ogImage?: string
					fields: Array<{ fieldId: number; value: string | null }>
				}
				ctx: { session?: { user?: { id?: string } } | null }
			}) => {
				const slug = opts.input.slug || slugify(opts.input.title)
				const now = new Date()

				const [entry] = await db
					.insert(entries)
					.values({
						collectionId: opts.input.collectionId,
						title: opts.input.title,
						slug,
						status: opts.input.status,
						metaTitle: opts.input.metaTitle || null,
						metaDescription: opts.input.metaDescription || null,
						ogImage: opts.input.ogImage || null,
						publishedAt: opts.input.status === "published" ? now : null,
					})
					.returning()

				if (opts.input.fields.length > 0) {
					await db.insert(entryFields).values(
						opts.input.fields.map((field) => ({
							entryId: entry.id,
							fieldId: field.fieldId,
							value: field.value,
						})),
					)
				}

				await createVersion(db, entry.id, opts.ctx.session?.user?.id)

				const collection = await db.query.collections.findFirst({
					where: eq(collections.id, opts.input.collectionId),
				})
				if (opts.input.status === "published" && collection) {
					await runEntryHook(ctx, "onEntryPublished", {
						entry,
						collection,
						url: makeEntryUrl(ctx, collection.slug, slug),
					})
				}

				return entry
			}),

		update: protectedProcedure
			.input(
				z.object({
					id: z.number(),
					title: z.string().optional(),
					slug: z.string().optional(),
					metaTitle: z.string().nullable().optional(),
					metaDescription: z.string().nullable().optional(),
					ogImage: z.string().nullable().optional(),
					fields: z.array(z.object({ fieldId: z.number(), value: z.string().nullable() })).optional(),
				}),
			)
			.mutation(async (opts: {
				input: {
					id: number
					title?: string
					slug?: string
					metaTitle?: string | null
					metaDescription?: string | null
					ogImage?: string | null
					fields?: Array<{ fieldId: number; value: string | null }>
				}
				ctx: { session?: { user?: { id?: string } } | null }
			}) => {
				const { id, fields, ...data } = opts.input
				const previous = await db.query.entries.findFirst({
					where: eq(entries.id, id),
					with: { collection: true },
				})

				await db.update(entries).set({ ...data, updatedAt: new Date() }).where(eq(entries.id, id))

				if (fields) {
					await db.delete(entryFields).where(eq(entryFields.entryId, id))
					if (fields.length > 0) {
						await db.insert(entryFields).values(
							fields.map((field) => ({
								entryId: id,
								fieldId: field.fieldId,
								value: field.value,
							})),
						)
					}
				}

				await createVersion(db, id, opts.ctx.session?.user?.id)
				const updated = await db.query.entries.findFirst({
					where: eq(entries.id, id),
					with: { collection: true },
				})

				if (previous && updated?.collection && previous.slug !== updated.slug) {
					await db.insert(entryRedirects).values({
						entryId: id,
						collectionSlug: updated.collection.slug,
						oldSlug: previous.slug,
						newSlug: updated.slug,
					})
					await runEntryHook(ctx, "onEntrySlugChanged", {
						entry: updated,
						collection: updated.collection,
						url: makeEntryUrl(ctx, updated.collection.slug, updated.slug),
						previousSlug: previous.slug,
					})
				}

				if (updated?.collection && updated.status === "published") {
					await runEntryHook(ctx, "onEntryUpdated", {
						entry: updated,
						collection: updated.collection,
						url: makeEntryUrl(ctx, updated.collection.slug, updated.slug),
					})
				}

				return updated
			}),

		updateStatus: protectedProcedure
			.input(z.object({ id: z.number(), status: z.enum(["draft", "published", "archived"]) }))
			.mutation(async (opts: { input: { id: number; status: "draft" | "published" | "archived" } }) => {
				const now = new Date()
				const [entry] = await db
					.update(entries)
					.set({
						status: opts.input.status,
						updatedAt: now,
						publishedAt: opts.input.status === "published" ? now : undefined,
					})
					.where(eq(entries.id, opts.input.id))
					.returning()

				if (opts.input.status === "published") {
					const collection = await db.query.collections.findFirst({
						where: eq(collections.id, entry.collectionId),
					})
					if (collection) {
						await runEntryHook(ctx, "onEntryPublished", {
							entry,
							collection,
							url: makeEntryUrl(ctx, collection.slug, entry.slug),
						})
					}
				}

				return entry
			}),

		delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			await db.delete(entries).where(eq(entries.id, opts.input.id))
			return { success: true }
		}),

		resolveRedirect: publicProcedure
			.input(z.object({ collectionSlug: z.string(), entrySlug: z.string() }))
			.query(async (opts: { input: { collectionSlug: string; entrySlug: string } }) => {
				return db.query.entryRedirects.findFirst({
					where: and(
						eq(entryRedirects.collectionSlug, opts.input.collectionSlug),
						eq(entryRedirects.oldSlug, opts.input.entrySlug),
					),
					orderBy: (table: typeof entryRedirects, helpers: { desc: typeof desc }) => [
						helpers.desc(table.createdAt),
					],
				})
			}),

		getVersions: protectedProcedure.input(z.object({ entryId: z.number() })).query(async (opts: { input: { entryId: number } }) => {
			return db.select().from(entryVersions).where(eq(entryVersions.entryId, opts.input.entryId)).orderBy(desc(entryVersions.versionNumber))
		}),

		restoreVersion: protectedProcedure
			.input(z.object({ entryId: z.number(), versionId: z.number() }))
			.mutation(async (opts: { input: { entryId: number; versionId: number }; ctx: { session?: { user?: { id?: string } } | null } }) => {
				const version = await db.query.entryVersions.findFirst({
					where: eq(entryVersions.id, opts.input.versionId),
				})
				if (!version) throw new Error("Version not found")

				const snapshot = JSON.parse(version.dataSnapshot) as Array<{ fieldId: number; value: string | null }>
				await db.delete(entryFields).where(eq(entryFields.entryId, opts.input.entryId))

				if (snapshot.length > 0) {
					await db.insert(entryFields).values(
						snapshot.map((item) => ({
							entryId: opts.input.entryId,
							fieldId: item.fieldId,
							value: item.value,
						})),
					)
				}

				await db.update(entries).set({ updatedAt: new Date() }).where(eq(entries.id, opts.input.entryId))
				await createVersion(db, opts.input.entryId, opts.ctx.session?.user?.id)

				return { success: true }
			}),
	} satisfies TRPCRouterRecord
}

export function createMediaRouter(ctx: CreateGearuRouterContext) {
	const { db, protectedProcedure } = ctx

	return {
		list: protectedProcedure
			.input(z.object({ limit: z.number().default(50), offset: z.number().default(0), mimeType: z.string().optional() }).optional())
			.query(async (opts: { input?: { limit?: number; offset?: number; mimeType?: string } }) => {
				const filters = opts.input ?? {}
				let query = db
					.select()
					.from(media)
					.orderBy(desc(media.createdAt))
					.limit(filters.limit ?? 50)
					.offset(filters.offset ?? 0)

				if (filters.mimeType) {
					query = query.where(eq(media.mimeType, filters.mimeType)) as typeof query
				}

				return query
			}),

		getById: protectedProcedure.input(z.object({ id: z.number() })).query(async (opts: { input: { id: number } }) => {
			return db.query.media.findFirst({
				where: eq(media.id, opts.input.id),
			})
		}),

		updateMetadata: protectedProcedure
			.input(z.object({
				id: z.number(),
				altText: z.string().max(500).nullable().optional(),
				caption: z.string().max(2000).nullable().optional(),
				width: z.number().int().positive().nullable().optional(),
				height: z.number().int().positive().nullable().optional(),
				focalX: z.number().int().min(0).max(100).nullable().optional(),
				focalY: z.number().int().min(0).max(100).nullable().optional(),
				variants: z.array(z.object({
					url: z.string().url(),
					width: z.number().int().positive(),
					height: z.number().int().positive(),
					format: z.enum(["avif", "webp", "jpeg", "png"]),
				})).optional(),
			}))
			.mutation(async (opts: {
				input: {
					id: number
					altText?: string | null
					caption?: string | null
					width?: number | null
					height?: number | null
					focalX?: number | null
					focalY?: number | null
					variants?: Array<{ url: string; width: number; height: number; format: "avif" | "webp" | "jpeg" | "png" }>
				}
			}) => {
				const { id, variants, ...metadata } = opts.input
				const [record] = await db
					.update(media)
					.set({
						...metadata,
						...(variants !== undefined ? { variants: JSON.stringify(variants) } : {}),
					})
					.where(eq(media.id, id))
					.returning()
				return record
			}),

		delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			const item = await db.query.media.findFirst({
				where: eq(media.id, opts.input.id),
			})
			if (item) {
				if (ctx.storage) await ctx.storage.delete(item as GearuMediaRecord)
				await db.delete(media).where(eq(media.id, opts.input.id))
			}

			return { success: true }
		}),
	} satisfies TRPCRouterRecord
}

export function createCommentsRouter(ctx: CreateGearuRouterContext) {
	const { db, publicProcedure, protectedProcedure } = ctx

	return {
		list: protectedProcedure
			.input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional(), limit: z.number().default(50), offset: z.number().default(0) }).optional())
			.query(async (opts: { input?: { status?: "pending" | "approved" | "rejected"; limit?: number; offset?: number } }) => {
				const filters = opts.input ?? {}
				let query = db
					.select()
					.from(comments)
					.leftJoin(entries, eq(comments.entryId, entries.id))
					.orderBy(desc(comments.createdAt))
					.limit(filters.limit ?? 50)
					.offset(filters.offset ?? 0)

				if (filters.status) {
					query = query.where(eq(comments.status, filters.status)) as typeof query
				}

				const results = await query
				return results.map((result: { comments: unknown; entries: unknown }) => ({
					...(result.comments as object),
					entry: result.entries,
				}))
			}),

		submit: publicProcedure
			.input(z.object({ entryId: z.number(), authorName: z.string().min(1), authorEmail: z.string().email(), content: z.string().min(1) }))
			.mutation(async (opts: {
				input: { entryId: number; authorName: string; authorEmail: string; content: string }
				ctx: {
					headers?: Headers
					session?: { user?: { id?: string; email?: string; emailVerified?: boolean } } | null
				}
			}) => {
				const member = opts.ctx.session?.user
				if (ctx.comments?.requireVerifiedMember && (!member?.id || !member.emailVerified)) {
					throw forbidden(ctx, "A verified account is required to comment")
				}

				const verifiedUserId = member?.id && member.emailVerified ? member.id : undefined
				const rateLimitKey = await ctx.comments?.getRateLimitKey?.({
					headers: opts.ctx.headers,
					userId: verifiedUserId,
				})
				if (rateLimitKey && ctx.comments?.checkRateLimit && !(await ctx.comments.checkRateLimit(rateLimitKey))) {
					throw tooManyRequests(ctx)
				}

				const sanitize = ctx.comments?.sanitize ?? sanitizeComment
				const content = sanitize(opts.input.content)
				if (!content) throw forbidden(ctx, "Comment content is empty")
				const spamScore = await ctx.comments?.scoreSpam?.({
					content,
					authorName: opts.input.authorName,
					authorEmail: opts.input.authorEmail,
				}) ?? 0
				const status = spamScore >= (ctx.comments?.spamThreshold ?? 80) ? "rejected" : "pending"

				const [comment] = await db.insert(comments).values({
					...opts.input,
					authorName: verifiedUserId ? (opts.input.authorName || "Member") : opts.input.authorName,
					authorEmail: verifiedUserId ? (member?.email ?? opts.input.authorEmail) : opts.input.authorEmail,
					userId: verifiedUserId ?? null,
					content,
					status,
					rateLimitKey: rateLimitKey ?? null,
					spamScore,
				}).returning()
				return comment
			}),

		moderate: protectedProcedure
			.input(z.object({ id: z.number(), status: z.enum(["approved", "rejected"]) }))
			.mutation(async (opts: { input: { id: number; status: "approved" | "rejected" } }) => {
				const [comment] = await db.update(comments).set({ status: opts.input.status }).where(eq(comments.id, opts.input.id)).returning()
				return comment
			}),

		delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			await db.delete(comments).where(eq(comments.id, opts.input.id))
			return { success: true }
		}),

		getByEntry: publicProcedure.input(z.object({ entryId: z.number() })).query(async (opts: { input: { entryId: number } }) => {
			return db
				.select({
					id: comments.id,
					entryId: comments.entryId,
					authorName: comments.authorName,
					content: comments.content,
					createdAt: comments.createdAt,
				})
				.from(comments)
				.where(and(eq(comments.entryId, opts.input.entryId), eq(comments.status, "approved")))
				.orderBy(desc(comments.createdAt))
		}),
	} satisfies TRPCRouterRecord
}

export function createSettingsRouter(ctx: CreateGearuRouterContext) {
	const { db, publicProcedure, protectedProcedure } = ctx

	return {
		getSiteSettings: protectedProcedure.query(async () => {
			const rows = await db.select().from(siteSettings)
			const settings: Record<string, string> = {}
			for (const row of rows) settings[row.key] = row.value
			return settings
		}),

		getPublicSiteSettings: publicProcedure.query(async () => {
			const rows = await db.select().from(siteSettings)
			const settings: Record<string, string> = {}
			for (const row of rows) {
				const allowed = ctx.isPublicSettingAllowed?.(row.key) ?? isPublicSettingKey(row.key)
				if (!allowed) continue
				settings[row.key] = row.value
			}
			return settings
		}),

		updateSiteSettings: protectedProcedure.input(z.record(z.string(), z.string())).mutation(async (opts: { input: Record<string, string> }) => {
			const now = new Date()

			for (const [key, value] of Object.entries(opts.input)) {
				if (!value.trim()) {
					await db.delete(siteSettings).where(eq(siteSettings.key, key))
					continue
				}

				const existing = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) })
				if (existing) {
					await db.update(siteSettings).set({ value, updatedAt: now }).where(eq(siteSettings.key, key))
				} else {
					await db.insert(siteSettings).values({ key, value, updatedAt: now })
				}
			}

			return { success: true }
		}),

		getAiConfig: protectedProcedure.query(async () => {
			const rows = await db.select().from(siteSettings)
			const config: Record<string, string> = {}

			for (const row of rows) {
				if (!row.key.startsWith("ai_")) continue
				if (row.key.startsWith("ai_api_key_") && row.value.length > 4) {
					config[row.key] = "********" + row.value.slice(-4)
					config[`${row.key}_set`] = "true"
				} else {
					config[row.key] = row.value
				}
			}

			return config
		}),

		updateAiConfig: protectedProcedure
			.input(
				z.object({
					provider: z.string().optional(),
					model: z.string().optional(),
					systemPrompt: z.string().optional(),
					apiKeys: z.record(z.string(), z.string()).optional(),
				}),
			)
			.mutation(async (opts: { input: { provider?: string; model?: string; systemPrompt?: string; apiKeys?: Record<string, string> } }) => {
				const now = new Date()
				const updates: Record<string, string> = {}

				if (opts.input.provider) updates.ai_default_provider = opts.input.provider
				if (opts.input.model) updates.ai_default_model = opts.input.model
				if (opts.input.systemPrompt !== undefined) updates.ai_system_prompt = opts.input.systemPrompt

				if (opts.input.apiKeys) {
					for (const [provider, key] of Object.entries(opts.input.apiKeys)) {
						if (key.startsWith("********")) continue
						updates[`ai_api_key_${provider}`] = key
					}
				}

				for (const [key, value] of Object.entries(updates)) {
					if (!value.trim()) {
						await db.delete(siteSettings).where(eq(siteSettings.key, key))
						continue
					}

					const existing = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) })
					if (existing) {
						await db.update(siteSettings).set({ value, updatedAt: now }).where(eq(siteSettings.key, key))
					} else {
						await db.insert(siteSettings).values({ key, value, updatedAt: now })
					}
				}

				return { success: true }
			}),

		listScripts: protectedProcedure.query(async () => {
			return db.select().from(trackingScripts).orderBy(trackingScripts.name)
		}),

		createScript: protectedProcedure
			.input(z.object({ name: z.string().min(1), location: z.enum(["head", "body_start", "body_end"]), script: z.string().min(1), active: z.boolean().default(true), trusted: z.boolean().default(false) }))
			.mutation(async (opts: { input: { name: string; location: "head" | "body_start" | "body_end"; script: string; active: boolean; trusted: boolean } }) => {
				const [script] = await db.insert(trackingScripts).values(opts.input).returning()
				return script
			}),

		updateScript: protectedProcedure
			.input(z.object({ id: z.number(), name: z.string().optional(), location: z.enum(["head", "body_start", "body_end"]).optional(), script: z.string().optional(), active: z.boolean().optional(), trusted: z.boolean().optional() }))
			.mutation(async (opts: { input: { id: number; name?: string; location?: "head" | "body_start" | "body_end"; script?: string; active?: boolean; trusted?: boolean } }) => {
				const { id, ...data } = opts.input
				const [script] = await db.update(trackingScripts).set(data).where(eq(trackingScripts.id, id)).returning()
				return script
			}),

		deleteScript: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			await db.delete(trackingScripts).where(eq(trackingScripts.id, opts.input.id))
			return { success: true }
		}),

		getActiveScripts: publicProcedure.query(async () => {
			const scripts = await db
				.select({
					id: trackingScripts.id,
					name: trackingScripts.name,
					location: trackingScripts.location,
					script: trackingScripts.script,
				})
				.from(trackingScripts)
				.where(and(eq(trackingScripts.active, true), eq(trackingScripts.trusted, true)))
			return scripts.filter((script: { id: number; name: string; location: string }) =>
				ctx.isTrackingScriptAllowed?.(script) ?? false,
			)
		}),
	} satisfies TRPCRouterRecord
}

export function createAiRouter(ctx: CreateGearuRouterContext) {
	const { db, protectedProcedure } = ctx

	return {
		createJob: protectedProcedure
			.input(
				z.object({
					csvRows: z.array(z.object({ title: z.string().min(1), schedule: z.number().default(0) })),
					collectionId: z.number(),
					imageMode: z.enum(["gemini", "openai", "unsplash", "pexels", "none"]).default("none"),
				}),
			)
			.mutation(async (opts: { input: { csvRows: Array<{ title: string; schedule: number }>; collectionId: number; imageMode: "gemini" | "openai" | "unsplash" | "pexels" | "none" } }) => {
				const [job] = await db
					.insert(aiJobs)
					.values({
						csvData: JSON.stringify(opts.input.csvRows),
						collectionId: opts.input.collectionId,
						imageMode: opts.input.imageMode,
						status: "pending",
					})
					.returning()

				await db.insert(aiJobItems).values(
					opts.input.csvRows.map((row) => ({
						jobId: job.id,
						title: row.title,
						scheduleDays: row.schedule,
						status: "pending" as const,
					})),
				)

				return job
			}),

		getJob: protectedProcedure.input(z.object({ id: z.number() })).query(async (opts: { input: { id: number } }) => {
			return db.query.aiJobs.findFirst({
				where: eq(aiJobs.id, opts.input.id),
				with: {
					items: { orderBy: (table: typeof aiJobItems, helpers: { asc: (value: unknown) => unknown[] | unknown }) => [helpers.asc(table.id)] },
					collection: true,
				},
			})
		}),

		listJobs: protectedProcedure.query(async () => {
			return db.query.aiJobs.findMany({
				with: { items: true, collection: true },
				orderBy: (table: typeof aiJobs, helpers: { desc: typeof desc }) => [helpers.desc(table.createdAt)],
			})
		}),

		updateJobStatus: protectedProcedure
			.input(z.object({ id: z.number(), status: z.enum(["pending", "processing", "completed", "failed"]) }))
			.mutation(async (opts: { input: { id: number; status: "pending" | "processing" | "completed" | "failed" } }) => {
				const updates: Record<string, unknown> = { status: opts.input.status }
				if (opts.input.status === "completed" || opts.input.status === "failed") {
					updates.completedAt = new Date()
				}

				await db.update(aiJobs).set(updates).where(eq(aiJobs.id, opts.input.id))
				return { success: true }
			}),

		updateJobItem: protectedProcedure
			.input(
				z.object({
					id: z.number(),
					status: z.enum(["pending", "generating_text", "generating_image", "saving", "completed", "failed"]).optional(),
					generatedText: z.string().optional(),
					generatedImageUrl: z.string().optional(),
					entryId: z.number().optional(),
					error: z.string().optional(),
					tokensUsed: z.number().optional(),
					imageTokensUsed: z.number().optional(),
				}),
			)
			.mutation(async (opts: {
				input: {
					id: number
					status?: "pending" | "generating_text" | "generating_image" | "saving" | "completed" | "failed"
					generatedText?: string
					generatedImageUrl?: string
					entryId?: number
					error?: string
					tokensUsed?: number
					imageTokensUsed?: number
				}
			}) => {
				const { id, ...data } = opts.input
				const updates: Record<string, unknown> = { ...data }
				if (updates.status === "completed" || updates.status === "failed") {
					updates.completedAt = new Date()
				}

				const [item] = await db.update(aiJobItems).set(updates).where(eq(aiJobItems.id, id)).returning()
				return item
			}),

		logUsage: protectedProcedure
			.input(
				z.object({
					jobId: z.number().optional(),
					jobItemId: z.number().optional(),
					provider: z.enum(["anthropic", "openai", "gemini"]),
					model: z.string(),
					type: z.enum(["text", "image"]),
					tokensInput: z.number().default(0),
					tokensOutput: z.number().default(0),
					costEstimate: z.string().optional(),
				}),
			)
			.mutation(async (opts: {
				input: {
					jobId?: number
					jobItemId?: number
					provider: "anthropic" | "openai" | "gemini"
					model: string
					type: "text" | "image"
					tokensInput: number
					tokensOutput: number
					costEstimate?: string
				}
			}) => {
				const [log] = await db.insert(aiUsageLog).values(opts.input).returning()
				return log
			}),

		getUsageStats: protectedProcedure.input(z.object({ days: z.number().default(30) }).optional()).query(async (opts: { input?: { days?: number } }) => {
			const days = opts.input?.days ?? 30
			const since = new Date()
			since.setDate(since.getDate() - days)

			const todayStart = new Date()
			todayStart.setHours(0, 0, 0, 0)

			const [today] = await db
				.select({
					totalInput: sql<number>`COALESCE(SUM(${aiUsageLog.tokensInput}), 0)`,
					totalOutput: sql<number>`COALESCE(SUM(${aiUsageLog.tokensOutput}), 0)`,
				})
				.from(aiUsageLog)
				.where(gte(aiUsageLog.createdAt, todayStart))

			const [period] = await db
				.select({
					totalInput: sql<number>`COALESCE(SUM(${aiUsageLog.tokensInput}), 0)`,
					totalOutput: sql<number>`COALESCE(SUM(${aiUsageLog.tokensOutput}), 0)`,
				})
				.from(aiUsageLog)
				.where(gte(aiUsageLog.createdAt, since))

			const byProvider = await db
				.select({
					provider: aiUsageLog.provider,
					type: aiUsageLog.type,
					totalInput: sql<number>`COALESCE(SUM(${aiUsageLog.tokensInput}), 0)`,
					totalOutput: sql<number>`COALESCE(SUM(${aiUsageLog.tokensOutput}), 0)`,
					count: sql<number>`COUNT(*)`,
				})
				.from(aiUsageLog)
				.where(gte(aiUsageLog.createdAt, since))
				.groupBy(aiUsageLog.provider, aiUsageLog.type)

			return {
				today: today ?? { totalInput: 0, totalOutput: 0 },
				period: period ?? { totalInput: 0, totalOutput: 0 },
				byProvider,
			}
		}),

		searchStockImages: protectedProcedure
			.input(z.object({ query: z.string(), source: z.enum(["unsplash", "pexels"]), page: z.number().default(1) }))
			.query(async (opts: { input: { query: string; source: "unsplash" | "pexels"; page: number } }) => {
				if (opts.input.source === "unsplash") {
					const key = process.env.UNSPLASH_ACCESS_KEY
					if (!key) throw new Error("UNSPLASH_ACCESS_KEY not configured")

					const response = await fetch(
						`https://api.unsplash.com/search/photos?query=${encodeURIComponent(opts.input.query)}&page=${opts.input.page}&per_page=12`,
						{ headers: { Authorization: `Client-ID ${key}` } },
					)
					const data = (await response.json()) as {
						results?: Array<{
							id: string
							urls: { regular: string; thumb: string }
							user: { name: string }
						}>
					}

					return (data.results ?? []).map((image) => ({
						id: image.id,
						url: image.urls.regular,
						thumb: image.urls.thumb,
						author: image.user.name,
						source: "unsplash" as const,
					}))
				}

				const key = process.env.PEXELS_API_KEY
				if (!key) throw new Error("PEXELS_API_KEY not configured")

				const response = await fetch(
					`https://api.pexels.com/v1/search?query=${encodeURIComponent(opts.input.query)}&page=${opts.input.page}&per_page=12`,
					{ headers: { Authorization: key } },
				)
				const data = (await response.json()) as {
					photos?: Array<{
						id: number
						src: { medium: string; tiny: string }
						photographer: string
					}>
				}

				return (data.photos ?? []).map((image) => ({
					id: String(image.id),
					url: image.src.medium,
					thumb: image.src.tiny,
					author: image.photographer,
					source: "pexels" as const,
				}))
			}),
	} satisfies TRPCRouterRecord
}

export function createGearuMetaRouter(ctx: CreateGearuRouterContext) {
	const { protectedProcedure } = ctx
	const installedVersion = "1.5.0"

	return {
		getVersion: protectedProcedure.query(async () => {
			let latest = installedVersion

			try {
				const response = await fetch("https://registry.npmjs.org/@gearu/core/latest", {
					headers: { Accept: "application/json" },
				})
				if (response.ok) {
					const data = (await response.json()) as { version?: string }
					latest = data.version ?? installedVersion
				}
			} catch {
				// Ignore registry lookup failures.
			}

			return { installed: installedVersion, latest }
		}),
	} satisfies TRPCRouterRecord
}

export function createGearuRouterRecord(ctx: CreateGearuRouterContext) {
	return {
		collections: createCollectionsRouter(ctx),
		entries: createEntriesRouter(ctx),
		media: createMediaRouter(ctx),
		comments: createCommentsRouter(ctx),
		settings: createSettingsRouter(ctx),
		ai: createAiRouter(ctx),
		gearu: createGearuMetaRouter(ctx),
	}
}
