import { z } from "zod"
import { eq, desc } from "drizzle-orm"
import { publicProcedure, protectedProcedure } from "../init"
import { db } from "#/db/index"
import { comments, entries } from "#/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"

export const commentsRouter = {
	list: protectedProcedure
		.input(
			z
				.object({
					status: z
						.enum(["pending", "approved", "rejected"])
						.optional(),
					limit: z.number().default(50),
					offset: z.number().default(0),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const filters = input ?? {}
			let query = db
				.select()
				.from(comments)
				.leftJoin(entries, eq(comments.entryId, entries.id))
				.orderBy(desc(comments.createdAt))
				.limit(filters.limit ?? 50)
				.offset(filters.offset ?? 0)

			if (filters.status) {
				query = query.where(
					eq(comments.status, filters.status),
				) as typeof query
			}

			const results = await query
			return results.map((r) => ({
				...r.comments,
				entry: r.entries,
			}))
		}),

	submit: publicProcedure
		.input(
			z.object({
				entryId: z.number(),
				authorName: z.string().min(1),
				authorEmail: z.string().email(),
				content: z.string().min(1),
			}),
		)
		.mutation(async ({ input }) => {
			const [comment] = await db
				.insert(comments)
				.values({ ...input, status: "pending" })
				.returning()
			return comment
		}),

	moderate: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				status: z.enum(["approved", "rejected"]),
			}),
		)
		.mutation(async ({ input }) => {
			const [comment] = await db
				.update(comments)
				.set({ status: input.status })
				.where(eq(comments.id, input.id))
				.returning()
			return comment
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db.delete(comments).where(eq(comments.id, input.id))
			return { success: true }
		}),

	getByEntry: publicProcedure
		.input(z.object({ entryId: z.number() }))
		.query(async ({ input }) => {
			return db
				.select()
				.from(comments)
				.where(eq(comments.entryId, input.entryId))
				.orderBy(desc(comments.createdAt))
		}),
} satisfies TRPCRouterRecord
