import { relations } from "drizzle-orm"
import {
	user,
	session,
	account,
	collections,
	collectionFields,
	entries,
	entryFields,
	entryVersions,
	comments,
	aiJobs,
	aiJobItems,
	aiUsageLog,
} from "./schema"

// ─── Better Auth Relations ──────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}))

// ─── CMS Relations ─────────────────────────────────────────

export const collectionsRelations = relations(collections, ({ many }) => ({
	fields: many(collectionFields),
	entries: many(entries),
	aiJobs: many(aiJobs),
}))

export const collectionFieldsRelations = relations(
	collectionFields,
	({ one, many }) => ({
		collection: one(collections, {
			fields: [collectionFields.collectionId],
			references: [collections.id],
		}),
		entryFields: many(entryFields),
	}),
)

export const entriesRelations = relations(entries, ({ one, many }) => ({
	collection: one(collections, {
		fields: [entries.collectionId],
		references: [collections.id],
	}),
	fields: many(entryFields),
	versions: many(entryVersions),
	comments: many(comments),
}))

export const entryFieldsRelations = relations(entryFields, ({ one }) => ({
	entry: one(entries, {
		fields: [entryFields.entryId],
		references: [entries.id],
	}),
	field: one(collectionFields, {
		fields: [entryFields.fieldId],
		references: [collectionFields.id],
	}),
}))

export const entryVersionsRelations = relations(entryVersions, ({ one }) => ({
	entry: one(entries, {
		fields: [entryVersions.entryId],
		references: [entries.id],
	}),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
	entry: one(entries, {
		fields: [comments.entryId],
		references: [entries.id],
	}),
}))

export const aiJobsRelations = relations(aiJobs, ({ one, many }) => ({
	collection: one(collections, {
		fields: [aiJobs.collectionId],
		references: [collections.id],
	}),
	items: many(aiJobItems),
	usageLogs: many(aiUsageLog),
}))

export const aiJobItemsRelations = relations(aiJobItems, ({ one, many }) => ({
	job: one(aiJobs, {
		fields: [aiJobItems.jobId],
		references: [aiJobs.id],
	}),
	entry: one(entries, {
		fields: [aiJobItems.entryId],
		references: [entries.id],
	}),
	usageLogs: many(aiUsageLog),
}))

export const aiUsageLogRelations = relations(aiUsageLog, ({ one }) => ({
	job: one(aiJobs, {
		fields: [aiUsageLog.jobId],
		references: [aiJobs.id],
	}),
	jobItem: one(aiJobItems, {
		fields: [aiUsageLog.jobItemId],
		references: [aiJobItems.id],
	}),
}))
