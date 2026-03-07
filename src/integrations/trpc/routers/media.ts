import { z } from "zod"
import { eq, desc } from "drizzle-orm"
import { protectedProcedure } from "../init"
import { db } from "#/db/index"
import { media } from "#/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"

export const mediaRouter = {
	list: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().default(50),
					offset: z.number().default(0),
					mimeType: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const filters = input ?? {}
			let query = db
				.select()
				.from(media)
				.orderBy(desc(media.createdAt))
				.limit(filters.limit ?? 50)
				.offset(filters.offset ?? 0)

			if (filters.mimeType) {
				query = query.where(
					eq(media.mimeType, filters.mimeType),
				) as typeof query
			}

			return query
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			return db.query.media.findFirst({
				where: eq(media.id, input.id),
			})
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			const item = await db.query.media.findFirst({
				where: eq(media.id, input.id),
			})
			if (item) {
				// Delete file from filesystem
				try {
					const fs = await import("node:fs/promises")
					const path = await import("node:path")
					const filePath = path.join(process.cwd(), "public", item.url)
					await fs.unlink(filePath).catch(() => {})
				} catch {
					// File may not exist, that's ok
				}
				await db.delete(media).where(eq(media.id, input.id))
			}
			return { success: true }
		}),
} satisfies TRPCRouterRecord
