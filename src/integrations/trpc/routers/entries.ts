import { z } from "zod"
import { eq, and, sql, desc } from "drizzle-orm"
import { protectedProcedure, publicProcedure } from "../init"
import { db } from "#/db/index"
import {
	entries,
	entryFields,
	entryVersions,
	collections,
} from "#/db/schema"
import { pingIndexNow, pingSitemap, getSiteUrl } from "#/lib/seo"
import type { TRPCRouterRecord } from "@trpc/server"

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
}

async function createVersion(
	entryId: number,
	createdBy?: string,
): Promise<void> {
	const currentMax = await db
		.select({ max: sql<number>`COALESCE(MAX(${entryVersions.versionNumber}), 0)` })
		.from(entryVersions)
		.where(eq(entryVersions.entryId, entryId))

	const newVersion = (currentMax[0]?.max ?? 0) + 1

	const fieldValues = await db
		.select()
		.from(entryFields)
		.where(eq(entryFields.entryId, entryId))

	const snapshot = JSON.stringify(
		fieldValues.map((f) => ({ fieldId: f.fieldId, value: f.value })),
	)

	await db.insert(entryVersions).values({
		entryId,
		versionNumber: newVersion,
		dataSnapshot: snapshot,
		createdBy,
	})
}

export const entriesRouter = {
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
		.query(async ({ input }) => {
			const filters = input ?? {}
			let query = db
				.select()
				.from(entries)
				.leftJoin(collections, eq(entries.collectionId, collections.id))
				.orderBy(desc(entries.updatedAt))
				.limit(filters.limit ?? 50)
				.offset(filters.offset ?? 0)

			if (filters.collectionId) {
				query = query.where(
					eq(entries.collectionId, filters.collectionId),
				) as typeof query
			}
			if (filters.status) {
				query = query.where(
					eq(entries.status, filters.status),
				) as typeof query
			}

			const results = await query
			return results.map((r) => ({
				...r.entries,
				collection: r.collections,
			}))
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const entry = await db.query.entries.findFirst({
				where: eq(entries.id, input.id),
				with: {
					fields: { with: { field: true } },
					collection: { with: { fields: true } },
				},
			})
			return entry
		}),

	getBySlug: publicProcedure
		.input(
			z.object({
				collectionSlug: z.string(),
				entrySlug: z.string(),
			}),
		)
		.query(async ({ input }) => {
			const collection = await db.query.collections.findFirst({
				where: eq(collections.slug, input.collectionSlug),
			})
			if (!collection) return null

			const entry = await db.query.entries.findFirst({
				where: and(
					eq(entries.collectionId, collection.id),
					eq(entries.slug, input.entrySlug),
					eq(entries.status, "published"),
				),
				with: {
					fields: { with: { field: true } },
					collection: true,
				},
			})
			return entry
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
				fields: z.array(
					z.object({
						fieldId: z.number(),
						value: z.string().nullable(),
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const slug = input.slug || slugify(input.title)
			const now = new Date()

			const [entry] = await db
				.insert(entries)
				.values({
					collectionId: input.collectionId,
					title: input.title,
					slug,
					status: input.status,
					metaTitle: input.metaTitle || null,
					metaDescription: input.metaDescription || null,
					ogImage: input.ogImage || null,
					publishedAt: input.status === "published" ? now : null,
				})
				.returning()

			if (input.fields.length > 0) {
				await db.insert(entryFields).values(
					input.fields.map((f) => ({
						entryId: entry.id,
						fieldId: f.fieldId,
						value: f.value,
					})),
				)
			}

			await createVersion(entry.id, ctx.session?.user?.id)

			// Notify search engines on publish
			if (input.status === "published") {
				const col = await db.query.collections.findFirst({
					where: eq(collections.id, input.collectionId),
				})
				if (col) {
					const url = `${getSiteUrl()}/${col.slug}/${slug}`
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
				fields: z
					.array(
						z.object({
							fieldId: z.number(),
							value: z.string().nullable(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const { id, fields, ...data } = input

			await db
				.update(entries)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(entries.id, id))

			if (fields) {
				await db.delete(entryFields).where(eq(entryFields.entryId, id))
				if (fields.length > 0) {
					await db.insert(entryFields).values(
						fields.map((f) => ({
							entryId: id,
							fieldId: f.fieldId,
							value: f.value,
						})),
					)
				}
			}

			await createVersion(id, ctx.session?.user?.id)

			return db.query.entries.findFirst({ where: eq(entries.id, id) })
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				status: z.enum(["draft", "published", "archived"]),
			}),
		)
		.mutation(async ({ input }) => {
			const now = new Date()
			const [entry] = await db
				.update(entries)
				.set({
					status: input.status,
					updatedAt: now,
					publishedAt: input.status === "published" ? now : undefined,
				})
				.where(eq(entries.id, input.id))
				.returning()

			// Notify search engines on publish
			if (input.status === "published") {
				const col = await db.query.collections.findFirst({
					where: eq(collections.id, entry.collectionId),
				})
				if (col) {
					const url = `${getSiteUrl()}/${col.slug}/${entry.slug}`
					pingIndexNow([url]).catch(() => {})
					pingSitemap().catch(() => {})
				}
			}

			return entry
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db.delete(entries).where(eq(entries.id, input.id))
			return { success: true }
		}),

	getVersions: protectedProcedure
		.input(z.object({ entryId: z.number() }))
		.query(async ({ input }) => {
			return db
				.select()
				.from(entryVersions)
				.where(eq(entryVersions.entryId, input.entryId))
				.orderBy(desc(entryVersions.versionNumber))
		}),

	restoreVersion: protectedProcedure
		.input(z.object({ entryId: z.number(), versionId: z.number() }))
		.mutation(async ({ input, ctx }) => {
			const version = await db.query.entryVersions.findFirst({
				where: eq(entryVersions.id, input.versionId),
			})
			if (!version) throw new Error("Version not found")

			const snapshot = JSON.parse(version.dataSnapshot) as Array<{
				fieldId: number
				value: string | null
			}>

			await db
				.delete(entryFields)
				.where(eq(entryFields.entryId, input.entryId))

			if (snapshot.length > 0) {
				await db.insert(entryFields).values(
					snapshot.map((s) => ({
						entryId: input.entryId,
						fieldId: s.fieldId,
						value: s.value,
					})),
				)
			}

			await db
				.update(entries)
				.set({ updatedAt: new Date() })
				.where(eq(entries.id, input.entryId))

			await createVersion(input.entryId, ctx.session?.user?.id)

			return { success: true }
		}),
} satisfies TRPCRouterRecord
