import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const leadForms = sqliteTable("lead_forms", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	slug: text().notNull().unique(),
	tag: text().notNull().default("general"),
	fields: text().notNull().default("[]"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})

export const leads = sqliteTable("leads", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	formId: integer("form_id")
		.notNull()
		.references(() => leadForms.id, { onDelete: "cascade" }),
	name: text().notNull(),
	email: text().notNull(),
	data: text().default("{}"),
	formTag: text("form_tag"),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
	utmTerm: text("utm_term"),
	utmContent: text("utm_content"),
	referrer: text(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})
