import { z } from "zod"
import { sql, gte } from "drizzle-orm"
import { pageViews } from "./schema"

export interface CreateAnalyticsRouterContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	publicProcedure: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protectedProcedure: any
}

export function createAnalyticsRouter(ctx: CreateAnalyticsRouterContext) {
	const { db, publicProcedure, protectedProcedure } = ctx
	return {
		recordPageView: publicProcedure
			.input(
				z.object({
					path: z.string(),
					referrer: z.string().optional(),
					utmSource: z.string().optional(),
					utmMedium: z.string().optional(),
					utmCampaign: z.string().optional(),
					utmTerm: z.string().optional(),
					utmContent: z.string().optional(),
				}),
			)
			.mutation(async (opts: { input: { path: string; referrer?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; utmTerm?: string; utmContent?: string } }) => {
				const { input } = opts
				await db.insert(pageViews).values(input)
				return { success: true }
			}),

		getDashboard: protectedProcedure
			.input(z.object({ days: z.number().default(30) }).optional())
			.query(async (opts: { input?: { days?: number } }) => {
				const days = opts.input?.days ?? 30
				const since = new Date()
				since.setDate(since.getDate() - days)
				const todayStart = new Date()
				todayStart.setHours(0, 0, 0, 0)
				const weekStart = new Date()
				weekStart.setDate(weekStart.getDate() - 7)

				const [viewsToday] = await db
					.select({ count: sql<number>`COUNT(*)` })
					.from(pageViews)
					.where(gte(pageViews.createdAt, todayStart))

				const [viewsWeek] = await db
					.select({ count: sql<number>`COUNT(*)` })
					.from(pageViews)
					.where(gte(pageViews.createdAt, weekStart))

				const [viewsTotal] = await db
					.select({ count: sql<number>`COUNT(*)` })
					.from(pageViews)
					.where(gte(pageViews.createdAt, since))

				const topPages = await db
					.select({
						path: pageViews.path,
						count: sql<number>`COUNT(*)`,
					})
					.from(pageViews)
					.where(gte(pageViews.createdAt, since))
					.groupBy(pageViews.path)
					.orderBy(sql`COUNT(*) DESC`)
					.limit(10)

				const trafficSources = await db
					.select({
						referrer: pageViews.referrer,
						count: sql<number>`COUNT(*)`,
					})
					.from(pageViews)
					.where(gte(pageViews.createdAt, since))
					.groupBy(pageViews.referrer)
					.orderBy(sql`COUNT(*) DESC`)
					.limit(10)

				const utmCampaigns = await db
					.select({
						source: pageViews.utmSource,
						medium: pageViews.utmMedium,
						campaign: pageViews.utmCampaign,
						count: sql<number>`COUNT(*)`,
					})
					.from(pageViews)
					.where(gte(pageViews.createdAt, since))
					.groupBy(pageViews.utmSource, pageViews.utmMedium, pageViews.utmCampaign)
					.orderBy(sql`COUNT(*) DESC`)
					.limit(10)

				const viewsOverTime = await db
					.select({
						date: sql<string>`DATE(${pageViews.createdAt}, 'unixepoch')`,
						count: sql<number>`COUNT(*)`,
					})
					.from(pageViews)
					.where(gte(pageViews.createdAt, since))
					.groupBy(sql`DATE(${pageViews.createdAt}, 'unixepoch')`)
					.orderBy(sql`DATE(${pageViews.createdAt}, 'unixepoch')`)

				return {
					viewsToday: viewsToday?.count ?? 0,
					viewsWeek: viewsWeek?.count ?? 0,
					viewsTotal: viewsTotal?.count ?? 0,
					topPages,
					trafficSources,
					utmCampaigns,
					viewsOverTime,
				}
			}),
	}
}
