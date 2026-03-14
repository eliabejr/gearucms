import { createTestCaller } from "../../../../tests/helpers/trpc-caller"
import {
	createTestDb,
	destroyTestDb,
	seedCollection,
	seedCollectionField,
} from "../../../../tests/helpers/test-db"

describe("entries router", () => {
	it("supports entry CRUD, filters, versions, and restoration", async () => {
		const testDb = createTestDb()
		const caller = createTestCaller(testDb, { user: { id: "editor-1" } })

		try {
			const collectionId = seedCollection(testDb.connection, { name: "Blog", slug: "blog" })
			const otherCollectionId = seedCollection(testDb.connection, { name: "Docs", slug: "docs" })
			const bodyFieldId = seedCollectionField(testDb.connection, {
				collectionId,
				name: "Body",
				slug: "body",
				type: "richtext",
			})

			const draft = await caller.entries.create({
				collectionId,
				title: "First Post",
				status: "draft",
				fields: [{ fieldId: bodyFieldId, value: "<p>Initial draft</p>" }],
			})
			const published = await caller.entries.create({
				collectionId: otherCollectionId,
				title: "Published Doc",
				status: "published",
				fields: [],
			})

			expect(draft.slug).toBe("first-post")
			expect(draft.publishedAt).toBeNull()
			expect(published.publishedAt).toBeInstanceOf(Date)

			const allEntries = await caller.entries.list()
			expect(allEntries).toHaveLength(2)

			expect(await caller.entries.list({ collectionId })).toHaveLength(1)
			expect(await caller.entries.list({ status: "published" })).toHaveLength(1)

			const paged = await caller.entries.list({ limit: 1, offset: 1 })
			expect(paged).toHaveLength(1)

			const byId = await caller.entries.getById({ id: draft.id })
			expect(byId?.fields[0]?.value).toBe("<p>Initial draft</p>")

			expect(await caller.entries.getBySlug({ collectionSlug: "blog", entrySlug: "first-post" })).toBeUndefined()
			expect(await caller.entries.getBySlug({ collectionSlug: "docs", entrySlug: "published-doc" })).toMatchObject({
				id: published.id,
				slug: "published-doc",
			})

			const updated = await caller.entries.update({
				id: draft.id,
				title: "Updated Post",
				slug: "updated-post",
				metaTitle: "Updated SEO Title",
				metaDescription: "Updated description",
				ogImage: "/hero.png",
				fields: [{ fieldId: bodyFieldId, value: "<p>Updated body</p>" }],
			})

			expect(updated).toMatchObject({
				title: "Updated Post",
				slug: "updated-post",
				metaTitle: "Updated SEO Title",
			})

			const versionsAfterUpdate = await caller.entries.getVersions({ entryId: draft.id })
			expect(versionsAfterUpdate).toHaveLength(2)
			expect(versionsAfterUpdate[0]?.versionNumber).toBe(2)

			const statusUpdated = await caller.entries.updateStatus({
				id: draft.id,
				status: "published",
			})
			expect(statusUpdated.status).toBe("published")
			expect(statusUpdated.publishedAt).toBeInstanceOf(Date)

			await caller.entries.updateStatus({ id: draft.id, status: "archived" })
			expect((await caller.entries.getById({ id: draft.id }))?.status).toBe("archived")

			await caller.entries.restoreVersion({
				entryId: draft.id,
				versionId: versionsAfterUpdate[1]!.id,
			})

			const restored = await caller.entries.getById({ id: draft.id })
			expect(restored?.fields[0]?.value).toBe("<p>Initial draft</p>")

			const versionsAfterRestore = await caller.entries.getVersions({ entryId: draft.id })
			expect(versionsAfterRestore[0]?.versionNumber).toBe(3)

			await caller.entries.delete({ id: published.id })
			expect(await caller.entries.getById({ id: published.id })).toBeUndefined()
		} finally {
			destroyTestDb(testDb.connection)
		}
	})
})
