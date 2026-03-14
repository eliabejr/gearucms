import Database from "better-sqlite3"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { createDb, type CoreSchema } from "../../packages/core/src/db"

export interface TestDatabase {
	connection: Database.Database
	db: BetterSQLite3Database<CoreSchema>
}

export function createTestDb(): TestDatabase {
	const connection = new Database(":memory:")
	connection.pragma("foreign_keys = ON")
	connection.exec(SCHEMA_SQL)

	return {
		connection,
		db: createDb(connection),
	}
}

export function destroyTestDb(connection: Database.Database) {
	connection.close()
}

export function seedCollection(
	connection: Database.Database,
	input: { name?: string; slug?: string; description?: string } = {},
) {
	const name = input.name ?? "Blog Posts"
	const slug = input.slug ?? "blog-posts"
	const description = input.description ?? "Posts collection"

	const result = connection
		.prepare("INSERT INTO collections (name, slug, description) VALUES (?, ?, ?)")
		.run(name, slug, description)

	return Number(result.lastInsertRowid)
}

export function seedCollectionField(
	connection: Database.Database,
	input: {
		collectionId: number
		name?: string
		slug?: string
		type?: string
		required?: boolean
		sortOrder?: number
	},
) {
	const name = input.name ?? "Content"
	const slug = input.slug ?? "content"
	const type = input.type ?? "text"
	const required = input.required ?? false
	const sortOrder = input.sortOrder ?? 0

	const result = connection
		.prepare(
			"INSERT INTO collection_fields (collection_id, name, slug, type, required, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
		)
		.run(input.collectionId, name, slug, type, required ? 1 : 0, sortOrder)

	return Number(result.lastInsertRowid)
}

export function seedEntry(
	connection: Database.Database,
	input: {
		collectionId: number
		title?: string
		slug?: string
		status?: string
		metaTitle?: string | null
		metaDescription?: string | null
		ogImage?: string | null
		publishedAt?: number | null
	},
) {
	const title = input.title ?? "Hello World"
	const slug = input.slug ?? "hello-world"
	const status = input.status ?? "draft"

	const result = connection
		.prepare(
			"INSERT INTO entries (collection_id, title, slug, status, meta_title, meta_description, og_image, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		)
		.run(
			input.collectionId,
			title,
			slug,
			status,
			input.metaTitle ?? null,
			input.metaDescription ?? null,
			input.ogImage ?? null,
			input.publishedAt ?? null,
		)

	return Number(result.lastInsertRowid)
}

export function seedEntryField(
	connection: Database.Database,
	input: { entryId: number; fieldId: number; value?: string | null },
) {
	const result = connection
		.prepare("INSERT INTO entry_fields (entry_id, field_id, value) VALUES (?, ?, ?)")
		.run(input.entryId, input.fieldId, input.value ?? null)

	return Number(result.lastInsertRowid)
}

export function seedEntryVersion(
	connection: Database.Database,
	input: {
		entryId: number
		versionNumber?: number
		dataSnapshot?: string
		createdBy?: string | null
	},
) {
	const result = connection
		.prepare(
			"INSERT INTO entry_versions (entry_id, version_number, data_snapshot, created_by) VALUES (?, ?, ?, ?)",
		)
		.run(
			input.entryId,
			input.versionNumber ?? 1,
			input.dataSnapshot ?? "[]",
			input.createdBy ?? null,
		)

	return Number(result.lastInsertRowid)
}

export function seedMedia(
	connection: Database.Database,
	input: {
		filename?: string
		originalName?: string
		url?: string
		size?: number
		mimeType?: string
		width?: number | null
		height?: number | null
	},
) {
	const result = connection
		.prepare(
			"INSERT INTO media (filename, original_name, url, size, mime_type, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)",
		)
		.run(
			input.filename ?? "hero.jpg",
			input.originalName ?? "hero.jpg",
			input.url ?? "uploads/hero.jpg",
			input.size ?? 2048,
			input.mimeType ?? "image/jpeg",
			input.width ?? null,
			input.height ?? null,
		)

	return Number(result.lastInsertRowid)
}

export function seedComment(
	connection: Database.Database,
	input: {
		entryId: number
		authorName?: string
		authorEmail?: string
		content?: string
		status?: string
	},
) {
	const result = connection
		.prepare(
			"INSERT INTO comments (entry_id, author_name, author_email, content, status) VALUES (?, ?, ?, ?, ?)",
		)
		.run(
			input.entryId,
			input.authorName ?? "Jane",
			input.authorEmail ?? "jane@example.com",
			input.content ?? "Great post",
			input.status ?? "pending",
		)

	return Number(result.lastInsertRowid)
}

export function seedSiteSetting(connection: Database.Database, key: string, value: string) {
	connection
		.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?)")
		.run(key, value)
}

export function seedTrackingScript(
	connection: Database.Database,
	input: {
		name?: string
		location?: string
		script?: string
		active?: boolean
	},
) {
	const result = connection
		.prepare("INSERT INTO tracking_scripts (name, location, script, active) VALUES (?, ?, ?, ?)")
		.run(
			input.name ?? "Analytics",
			input.location ?? "head",
			input.script ?? "<script>console.log('analytics')</script>",
			input.active ?? true ? 1 : 0,
		)

	return Number(result.lastInsertRowid)
}

export function seedAiJob(
	connection: Database.Database,
	input: {
		collectionId: number
		status?: string
		csvData?: string
		imageMode?: string
		completedAt?: number | null
	},
) {
	const result = connection
		.prepare(
			"INSERT INTO ai_jobs (status, csv_data, collection_id, image_mode, completed_at) VALUES (?, ?, ?, ?, ?)",
		)
		.run(
			input.status ?? "pending",
			input.csvData ?? JSON.stringify([{ title: "Draft post", schedule: 0 }]),
			input.collectionId,
			input.imageMode ?? "none",
			input.completedAt ?? null,
		)

	return Number(result.lastInsertRowid)
}

export function seedAiJobItem(
	connection: Database.Database,
	input: {
		jobId: number
		title?: string
		scheduleDays?: number
		status?: string
		entryId?: number | null
		generatedText?: string | null
		generatedImageUrl?: string | null
		error?: string | null
		tokensUsed?: number
		imageTokensUsed?: number
		completedAt?: number | null
	},
) {
	const result = connection
		.prepare(
			"INSERT INTO ai_job_items (job_id, title, schedule_days, status, entry_id, generated_text, generated_image_url, error, tokens_used, image_tokens_used, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		)
		.run(
			input.jobId,
			input.title ?? "Draft post",
			input.scheduleDays ?? 0,
			input.status ?? "pending",
			input.entryId ?? null,
			input.generatedText ?? null,
			input.generatedImageUrl ?? null,
			input.error ?? null,
			input.tokensUsed ?? 0,
			input.imageTokensUsed ?? 0,
			input.completedAt ?? null,
		)

	return Number(result.lastInsertRowid)
}

export function seedAiUsageLog(
	connection: Database.Database,
	input: {
		jobId?: number | null
		jobItemId?: number | null
		provider?: string
		model?: string
		type?: string
		tokensInput?: number
		tokensOutput?: number
		costEstimate?: string | null
		createdAt?: number | null
	},
) {
	const result = connection
		.prepare(
			"INSERT INTO ai_usage_log (job_id, job_item_id, provider, model, type, tokens_input, tokens_output, cost_estimate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		)
		.run(
			input.jobId ?? null,
			input.jobItemId ?? null,
			input.provider ?? "openai",
			input.model ?? "gpt-4o-mini",
			input.type ?? "text",
			input.tokensInput ?? 10,
			input.tokensOutput ?? 20,
			input.costEstimate ?? null,
			input.createdAt ?? Math.floor(Date.now() / 1000),
		)

	return Number(result.lastInsertRowid)
}

const SCHEMA_SQL = `
CREATE TABLE user (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	email_verified INTEGER NOT NULL DEFAULT 0,
	image TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE session (
	id TEXT PRIMARY KEY,
	expires_at INTEGER NOT NULL,
	token TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
	ip_address TEXT,
	user_agent TEXT,
	user_id TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE account (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL,
	provider_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	access_token TEXT,
	refresh_token TEXT,
	id_token TEXT,
	access_token_expires_at INTEGER,
	refresh_token_expires_at INTEGER,
	scope TEXT,
	password TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE verification (
	id TEXT PRIMARY KEY,
	identifier TEXT NOT NULL,
	value TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	created_at INTEGER DEFAULT (unixepoch()),
	updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE collections (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	description TEXT,
	created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE collection_fields (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	collection_id INTEGER NOT NULL,
	name TEXT NOT NULL,
	slug TEXT NOT NULL,
	type TEXT NOT NULL,
	required INTEGER DEFAULT 0,
	sort_order INTEGER DEFAULT 0,
	FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE entries (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	collection_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	slug TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'draft',
	meta_title TEXT,
	meta_description TEXT,
	og_image TEXT,
	created_at INTEGER DEFAULT (unixepoch()),
	updated_at INTEGER DEFAULT (unixepoch()),
	published_at INTEGER,
	FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE entry_fields (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	entry_id INTEGER NOT NULL,
	field_id INTEGER NOT NULL,
	value TEXT,
	FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
	FOREIGN KEY (field_id) REFERENCES collection_fields(id) ON DELETE CASCADE
);

CREATE TABLE entry_versions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	entry_id INTEGER NOT NULL,
	version_number INTEGER NOT NULL,
	data_snapshot TEXT NOT NULL,
	created_at INTEGER DEFAULT (unixepoch()),
	created_by TEXT,
	FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

CREATE TABLE media (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	filename TEXT NOT NULL,
	original_name TEXT NOT NULL,
	url TEXT NOT NULL,
	size INTEGER NOT NULL,
	mime_type TEXT NOT NULL,
	width INTEGER,
	height INTEGER,
	created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE comments (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	entry_id INTEGER NOT NULL,
	author_name TEXT NOT NULL,
	author_email TEXT NOT NULL,
	content TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending',
	created_at INTEGER DEFAULT (unixepoch()),
	FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

CREATE TABLE tracking_scripts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	location TEXT NOT NULL,
	script TEXT NOT NULL,
	active INTEGER DEFAULT 1,
	created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE ai_jobs (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	status TEXT NOT NULL DEFAULT 'pending',
	csv_data TEXT NOT NULL,
	collection_id INTEGER NOT NULL,
	image_mode TEXT NOT NULL DEFAULT 'none',
	created_at INTEGER DEFAULT (unixepoch()),
	completed_at INTEGER,
	FOREIGN KEY (collection_id) REFERENCES collections(id)
);

CREATE TABLE ai_job_items (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	job_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	schedule_days INTEGER NOT NULL DEFAULT 0,
	status TEXT NOT NULL DEFAULT 'pending',
	entry_id INTEGER,
	generated_text TEXT,
	generated_image_url TEXT,
	error TEXT,
	tokens_used INTEGER DEFAULT 0,
	image_tokens_used INTEGER DEFAULT 0,
	created_at INTEGER DEFAULT (unixepoch()),
	completed_at INTEGER,
	FOREIGN KEY (job_id) REFERENCES ai_jobs(id) ON DELETE CASCADE,
	FOREIGN KEY (entry_id) REFERENCES entries(id)
);

CREATE TABLE ai_usage_log (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	job_id INTEGER,
	job_item_id INTEGER,
	provider TEXT NOT NULL,
	model TEXT NOT NULL,
	type TEXT NOT NULL,
	tokens_input INTEGER DEFAULT 0,
	tokens_output INTEGER DEFAULT 0,
	cost_estimate TEXT,
	created_at INTEGER DEFAULT (unixepoch()),
	FOREIGN KEY (job_id) REFERENCES ai_jobs(id) ON DELETE CASCADE,
	FOREIGN KEY (job_item_id) REFERENCES ai_job_items(id) ON DELETE CASCADE
);

CREATE TABLE site_settings (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL,
	updated_at INTEGER DEFAULT (unixepoch())
);
`
