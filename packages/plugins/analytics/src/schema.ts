import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const pageViews = sqliteTable("page_views", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	path: text().notNull(),
	referrer: text(),
	userAgent: text("user_agent"),
	country: text(),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
	utmTerm: text("utm_term"),
	utmContent: text("utm_content"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})
