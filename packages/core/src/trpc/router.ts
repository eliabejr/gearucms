import type { TRPCError } from "@trpc/server"
import type { TRPCRouterRecord } from "@trpc/server"
import { and, desc, eq, gte, sql } from "drizzle-orm"
import { z } from "zod"
import {
	aiJobItems,
	aiJobs,
	aiUsageLog,
	collectionFields,
	collections,
	comments,
	entries,
	entryFields,
	entryVersions,
	media,
	siteSettings,
	trackingScripts,
} from "../schema/index"
import { getSiteUrl, pingIndexNow, pingSitemap } from "../seo"

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
}

const fieldTypeEnum = z.enum(["text", "richtext", "number", "boolean", "image", "relation", "date"])

export interface CreateGearuRouterContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	publicProcedure: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protectedProcedure: any
	TRPCError?: typeof TRPCError
}

export function createCollectionsRouter(ctx: CreateGearuRouterContext) {
	const { db, protectedProcedure } = ctx

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
			.input(z.object({ name: z.string().min(1), slug: z.string().optional(), description: z.string().optional() }))
			.mutation(async (opts: { input: { name: string; slug?: string; description?: string } }) => {
				const slug = opts.input.slug || slugify(opts.input.name)
				const [collection] = await db
					.insert(collections)
					.values({ name: opts.input.name, slug, description: opts.input.description })
					.returning()
				return collection
			}),

		update: protectedProcedure
			.input(z.object({ id: z.number(), name: z.string().min(1).optional(), slug: z.string().optional(), description: z.string().optional() }))
			.mutation(async (opts: { input: { id: number; name?: string; slug?: string; description?: string } }) => {
				const { id, ...data } = opts.input
				const [collection] = await db.update(collections).set(data).where(eq(collections.id, id)).returning()
				return collection
			}),

		delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			await db.delete(collections).where(eq(collections.id, opts.input.id))
			return { success: true }
		}),

		addField: protectedProcedure
			.input(z.object({
				collectionId: z.number(),
				name: z.string().min(1),
				slug: z.string().optional(),
				type: fieldTypeEnum,
				required: z.boolean().default(false),
			}))
			.mutation(async (opts: { input: { collectionId: number; name: string; slug?: string; type: z.infer<typeof fieldTypeEnum>; required: boolean } }) => {
				const slug = opts.input.slug || slugify(opts.input.name)
				const existing = await db.query.collectionFields.findMany({
					where: eq(collectionFields.collectionId, opts.input.collectionId),
				})
				const [field] = await db
					.insert(collectionFields)
					.values({
						collectionId: opts.input.collectionId,
						name: opts.input.name,
						slug,
						type: opts.input.type,
						required: opts.input.required,
						sortOrder: existing.length,
					})
					.returning()
				return field
			}),

		updateField: protectedProcedure
			.input(z.object({
				id: z.number(),
				name: z.string().optional(),
				slug: z.string().optional(),
				type: fieldTypeEnum.optional(),
				required: z.boolean().optional(),
			}))
			.mutation(async (opts: { input: { id: number; name?: string; slug?: string; type?: z.infer<typeof fieldTypeEnum>; required?: boolean } }) => {
				const { id, ...data } = opts.input
				const [field] = await db.update(collectionFields).set(data).where(eq(collectionFields.id, id)).returning()
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

				if (opts.input.status === "published") {
					const collection = await db.query.collections.findFirst({
						where: eq(collections.id, opts.input.collectionId),
					})
					if (collection) {
						const url = `${getSiteUrl()}/${collection.slug}/${slug}`
						pingIndexNow([url]).catch(() => {})
						pingSitemap().catch(() => {})
					}
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
				return db.query.entries.findFirst({ where: eq(entries.id, id) })
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
						const url = `${getSiteUrl()}/${collection.slug}/${entry.slug}`
						pingIndexNow([url]).catch(() => {})
						pingSitemap().catch(() => {})
					}
				}

				return entry
			}),

		delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			await db.delete(entries).where(eq(entries.id, opts.input.id))
			return { success: true }
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

		delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			const item = await db.query.media.findFirst({
				where: eq(media.id, opts.input.id),
			})
			if (item) {
				try {
					const fs = await import("node:fs/promises")
					const path = await import("node:path")
					const filePath = path.join(process.cwd(), "public", item.url)
					await fs.unlink(filePath).catch(() => {})
				} catch {
					// Ignore missing files when cleaning up media records.
				}

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
			.mutation(async (opts: { input: { entryId: number; authorName: string; authorEmail: string; content: string } }) => {
				const [comment] = await db.insert(comments).values({ ...opts.input, status: "pending" }).returning()
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
			return db.select().from(comments).where(eq(comments.entryId, opts.input.entryId)).orderBy(desc(comments.createdAt))
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
				if (row.key.startsWith("ai_api_key_")) continue
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
			.input(z.object({ name: z.string().min(1), location: z.enum(["head", "body_start", "body_end"]), script: z.string().min(1), active: z.boolean().default(true) }))
			.mutation(async (opts: { input: { name: string; location: "head" | "body_start" | "body_end"; script: string; active: boolean } }) => {
				const [script] = await db.insert(trackingScripts).values(opts.input).returning()
				return script
			}),

		updateScript: protectedProcedure
			.input(z.object({ id: z.number(), name: z.string().optional(), location: z.enum(["head", "body_start", "body_end"]).optional(), script: z.string().optional(), active: z.boolean().optional() }))
			.mutation(async (opts: { input: { id: number; name?: string; location?: "head" | "body_start" | "body_end"; script?: string; active?: boolean } }) => {
				const { id, ...data } = opts.input
				const [script] = await db.update(trackingScripts).set(data).where(eq(trackingScripts.id, id)).returning()
				return script
			}),

		deleteScript: protectedProcedure.input(z.object({ id: z.number() })).mutation(async (opts: { input: { id: number } }) => {
			await db.delete(trackingScripts).where(eq(trackingScripts.id, opts.input.id))
			return { success: true }
		}),

		getActiveScripts: publicProcedure.query(async () => {
			return db.select().from(trackingScripts).where(eq(trackingScripts.active, true))
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
	const installedVersion = "1.0.0"

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
