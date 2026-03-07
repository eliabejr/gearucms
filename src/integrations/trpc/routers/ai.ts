import { z } from "zod"
import { eq, gte, sql } from "drizzle-orm"
import { protectedProcedure } from "../init"
import { db } from "#/db/index"
import { aiJobs, aiJobItems, aiUsageLog } from "#/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"

export const aiRouter = {
	createJob: protectedProcedure
		.input(
			z.object({
				csvRows: z.array(
					z.object({
						title: z.string().min(1),
						schedule: z.number().default(0),
					}),
				),
				collectionId: z.number(),
				imageMode: z
					.enum(["gemini", "openai", "unsplash", "pexels", "none"])
					.default("none"),
			}),
		)
		.mutation(async ({ input }) => {
			const [job] = await db
				.insert(aiJobs)
				.values({
					csvData: JSON.stringify(input.csvRows),
					collectionId: input.collectionId,
					imageMode: input.imageMode,
					status: "pending",
				})
				.returning()

			await db.insert(aiJobItems).values(
				input.csvRows.map((row) => ({
					jobId: job.id,
					title: row.title,
					scheduleDays: row.schedule,
					status: "pending" as const,
				})),
			)

			return job
		}),

	getJob: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const job = await db.query.aiJobs.findFirst({
				where: eq(aiJobs.id, input.id),
				with: {
					items: { orderBy: (i, { asc }) => [asc(i.id)] },
					collection: true,
				},
			})
			return job
		}),

	listJobs: protectedProcedure.query(async () => {
		return db.query.aiJobs.findMany({
			with: { items: true, collection: true },
			orderBy: (j, { desc: d }) => [d(j.createdAt)],
		})
	}),

	updateJobStatus: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				status: z.enum(["pending", "processing", "completed", "failed"]),
			}),
		)
		.mutation(async ({ input }) => {
			const updates: Record<string, unknown> = { status: input.status }
			if (input.status === "completed" || input.status === "failed") {
				updates.completedAt = new Date()
			}
			await db
				.update(aiJobs)
				.set(updates)
				.where(eq(aiJobs.id, input.id))
			return { success: true }
		}),

	updateJobItem: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				status: z
					.enum([
						"pending",
						"generating_text",
						"generating_image",
						"saving",
						"completed",
						"failed",
					])
					.optional(),
				generatedText: z.string().optional(),
				generatedImageUrl: z.string().optional(),
				entryId: z.number().optional(),
				error: z.string().optional(),
				tokensUsed: z.number().optional(),
				imageTokensUsed: z.number().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input
			if (data.status === "completed" || data.status === "failed") {
				;(data as Record<string, unknown>).completedAt = new Date()
			}
			const [item] = await db
				.update(aiJobItems)
				.set(data)
				.where(eq(aiJobItems.id, id))
				.returning()
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
		.mutation(async ({ input }) => {
			const [log] = await db
				.insert(aiUsageLog)
				.values(input)
				.returning()
			return log
		}),

	getUsageStats: protectedProcedure
		.input(
			z
				.object({
					days: z.number().default(30),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const days = input?.days ?? 30
			const since = new Date()
			since.setDate(since.getDate() - days)

			const todayStart = new Date()
			todayStart.setHours(0, 0, 0, 0)

			const [todayStats] = await db
				.select({
					totalInput: sql<number>`COALESCE(SUM(${aiUsageLog.tokensInput}), 0)`,
					totalOutput: sql<number>`COALESCE(SUM(${aiUsageLog.tokensOutput}), 0)`,
				})
				.from(aiUsageLog)
				.where(gte(aiUsageLog.createdAt, todayStart))

			const [periodStats] = await db
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
				today: todayStats ?? { totalInput: 0, totalOutput: 0 },
				period: periodStats ?? { totalInput: 0, totalOutput: 0 },
				byProvider,
			}
		}),

	searchStockImages: protectedProcedure
		.input(
			z.object({
				query: z.string(),
				source: z.enum(["unsplash", "pexels"]),
				page: z.number().default(1),
			}),
		)
		.query(async ({ input }) => {
			if (input.source === "unsplash") {
				const key = process.env.UNSPLASH_ACCESS_KEY
				if (!key) throw new Error("UNSPLASH_ACCESS_KEY not configured")

				const response = await fetch(
					`https://api.unsplash.com/search/photos?query=${encodeURIComponent(input.query)}&page=${input.page}&per_page=12`,
					{
						headers: {
							Authorization: `Client-ID ${key}`,
						},
					},
				)
				const data = await response.json()
				return (data.results ?? []).map(
					(img: {
						id: string
						urls: { regular: string; thumb: string }
						user: { name: string }
						links: { download_location: string }
					}) => ({
						id: img.id,
						url: img.urls.regular,
						thumb: img.urls.thumb,
						author: img.user.name,
						source: "unsplash" as const,
					}),
				)
			}

			// Pexels
			const key = process.env.PEXELS_API_KEY
			if (!key) throw new Error("PEXELS_API_KEY not configured")

			const response = await fetch(
				`https://api.pexels.com/v1/search?query=${encodeURIComponent(input.query)}&page=${input.page}&per_page=12`,
				{
					headers: { Authorization: key },
				},
			)
			const data = await response.json()
			return (data.photos ?? []).map(
				(img: {
					id: number
					src: { medium: string; tiny: string }
					photographer: string
				}) => ({
					id: String(img.id),
					url: img.src.medium,
					thumb: img.src.tiny,
					author: img.photographer,
					source: "pexels" as const,
				}),
			)
		}),
} satisfies TRPCRouterRecord
