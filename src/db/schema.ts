import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const user = sqliteTable("user", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	image: text(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const session = sqliteTable("session", {
	id: text().primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text().notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
})

export const account = sqliteTable("account", {
	id: text().primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
	scope: text(),
	password: text(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
})

export const verification = sqliteTable("verification", {
	id: text().primaryKey(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
})

export const todos = sqliteTable("todos", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})

export const collections = sqliteTable("collections", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	slug: text().notNull().unique(),
	description: text(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})

export const collectionFields = sqliteTable("collection_fields", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	collectionId: integer("collection_id")
		.notNull()
		.references(() => collections.id, { onDelete: "cascade" }),
	name: text().notNull(),
	slug: text().notNull(),
	type: text().notNull(),
	required: integer({ mode: "boolean" }).default(false),
	sortOrder: integer("sort_order").default(0),
})

export const entries = sqliteTable("entries", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	collectionId: integer("collection_id")
		.notNull()
		.references(() => collections.id, { onDelete: "cascade" }),
	title: text().notNull(),
	slug: text().notNull(),
	status: text().notNull().default("draft"),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	ogImage: text("og_image"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	publishedAt: integer("published_at", { mode: "timestamp" }),
})

export const entryFields = sqliteTable("entry_fields", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	entryId: integer("entry_id")
		.notNull()
		.references(() => entries.id, { onDelete: "cascade" }),
	fieldId: integer("field_id")
		.notNull()
		.references(() => collectionFields.id, { onDelete: "cascade" }),
	value: text(),
})

export const entryVersions = sqliteTable("entry_versions", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	entryId: integer("entry_id")
		.notNull()
		.references(() => entries.id, { onDelete: "cascade" }),
	versionNumber: integer("version_number").notNull(),
	dataSnapshot: text("data_snapshot").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	createdBy: text("created_by"),
})

export const media = sqliteTable("media", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	filename: text().notNull(),
	originalName: text("original_name").notNull(),
	url: text().notNull(),
	size: integer().notNull(),
	mimeType: text("mime_type").notNull(),
	width: integer(),
	height: integer(),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})

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

export const comments = sqliteTable("comments", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	entryId: integer("entry_id")
		.notNull()
		.references(() => entries.id, { onDelete: "cascade" }),
	authorName: text("author_name").notNull(),
	authorEmail: text("author_email").notNull(),
	content: text().notNull(),
	status: text().notNull().default("pending"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})

export const trackingScripts = sqliteTable("tracking_scripts", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	location: text().notNull(),
	script: text().notNull(),
	active: integer({ mode: "boolean" }).default(true),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})

export const aiJobs = sqliteTable("ai_jobs", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	status: text().notNull().default("pending"),
	csvData: text("csv_data").notNull(),
	collectionId: integer("collection_id")
		.notNull()
		.references(() => collections.id),
	imageMode: text("image_mode").notNull().default("none"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	completedAt: integer("completed_at", { mode: "timestamp" }),
})

export const aiJobItems = sqliteTable("ai_job_items", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	jobId: integer("job_id")
		.notNull()
		.references(() => aiJobs.id, { onDelete: "cascade" }),
	title: text().notNull(),
	scheduleDays: integer("schedule_days").notNull().default(0),
	status: text().notNull().default("pending"),
	entryId: integer("entry_id").references(() => entries.id),
	generatedText: text("generated_text"),
	generatedImageUrl: text("generated_image_url"),
	error: text(),
	tokensUsed: integer("tokens_used").default(0),
	imageTokensUsed: integer("image_tokens_used").default(0),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	completedAt: integer("completed_at", { mode: "timestamp" }),
})

export const aiUsageLog = sqliteTable("ai_usage_log", {
	id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
	jobId: integer("job_id").references(() => aiJobs.id, { onDelete: "cascade" }),
	jobItemId: integer("job_item_id").references(() => aiJobItems.id, {
		onDelete: "cascade",
	}),
	provider: text().notNull(),
	model: text().notNull(),
	type: text().notNull(),
	tokensInput: integer("tokens_input").default(0),
	tokensOutput: integer("tokens_output").default(0),
	costEstimate: text("cost_estimate"),
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})

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

export const siteSettings = sqliteTable("site_settings", {
	key: text().primaryKey(),
	value: text().notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
})
