import { z } from "zod"
import { eq } from "drizzle-orm"
import { publicProcedure, protectedProcedure } from "../init"
import { db } from "#/db/index"
import { trackingScripts } from "#/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"

export const settingsRouter = {
	listScripts: protectedProcedure.query(async () => {
		return db.select().from(trackingScripts).orderBy(trackingScripts.name)
	}),

	createScript: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				location: z.enum(["head", "body_start", "body_end"]),
				script: z.string().min(1),
				active: z.boolean().default(true),
			}),
		)
		.mutation(async ({ input }) => {
			const [script] = await db
				.insert(trackingScripts)
				.values(input)
				.returning()
			return script
		}),

	updateScript: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().optional(),
				location: z.enum(["head", "body_start", "body_end"]).optional(),
				script: z.string().optional(),
				active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input
			const [script] = await db
				.update(trackingScripts)
				.set(data)
				.where(eq(trackingScripts.id, id))
				.returning()
			return script
		}),

	deleteScript: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db
				.delete(trackingScripts)
				.where(eq(trackingScripts.id, input.id))
			return { success: true }
		}),

	getActiveScripts: publicProcedure.query(async () => {
		return db
			.select()
			.from(trackingScripts)
			.where(eq(trackingScripts.active, true))
	}),
} satisfies TRPCRouterRecord
