import { z } from "zod"
import { eq } from "drizzle-orm"
import { protectedProcedure } from "../init"
import { db } from "#/db/index"
import { collections, collectionFields } from "#/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
}

const fieldTypeEnum = z.enum([
	"text",
	"richtext",
	"number",
	"boolean",
	"image",
	"relation",
	"date",
])

export const collectionsRouter = {
	list: protectedProcedure.query(async () => {
		return db.query.collections.findMany({
			with: { fields: true, entries: true },
			orderBy: (c, { desc }) => [desc(c.createdAt)],
		})
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			return db.query.collections.findFirst({
				where: eq(collections.id, input.id),
				with: {
					fields: { orderBy: (f, { asc }) => [asc(f.sortOrder)] },
				},
			})
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				slug: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const slug = input.slug || slugify(input.name)
			const [collection] = await db
				.insert(collections)
				.values({ name: input.name, slug, description: input.description })
				.returning()
			return collection
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				slug: z.string().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input
			const [collection] = await db
				.update(collections)
				.set(data)
				.where(eq(collections.id, id))
				.returning()
			return collection
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db.delete(collections).where(eq(collections.id, input.id))
			return { success: true }
		}),

	addField: protectedProcedure
		.input(
			z.object({
				collectionId: z.number(),
				name: z.string().min(1),
				slug: z.string().optional(),
				type: fieldTypeEnum,
				required: z.boolean().default(false),
			}),
		)
		.mutation(async ({ input }) => {
			const slug = input.slug || slugify(input.name)
			const existing = await db.query.collectionFields.findMany({
				where: eq(collectionFields.collectionId, input.collectionId),
			})
			const [field] = await db
				.insert(collectionFields)
				.values({
					collectionId: input.collectionId,
					name: input.name,
					slug,
					type: input.type,
					required: input.required,
					sortOrder: existing.length,
				})
				.returning()
			return field
		}),

	updateField: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().optional(),
				slug: z.string().optional(),
				type: fieldTypeEnum.optional(),
				required: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input
			const [field] = await db
				.update(collectionFields)
				.set(data)
				.where(eq(collectionFields.id, id))
				.returning()
			return field
		}),

	removeField: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db
				.delete(collectionFields)
				.where(eq(collectionFields.id, input.id))
			return { success: true }
		}),

	reorderFields: protectedProcedure
		.input(z.array(z.object({ id: z.number(), sortOrder: z.number() })))
		.mutation(async ({ input }) => {
			for (const item of input) {
				await db
					.update(collectionFields)
					.set({ sortOrder: item.sortOrder })
					.where(eq(collectionFields.id, item.id))
			}
			return { success: true }
		}),
} satisfies TRPCRouterRecord
