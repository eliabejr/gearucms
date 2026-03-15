import { createTestCaller } from "../../../../tests/helpers/trpc-caller"
import {
	createTestDb,
	destroyTestDb,
	seedCollection,
	seedCollectionField,
} from "../../../../tests/helpers/test-db"

describe("collections router", () => {
	it("creates, lists, reads, updates, deletes, and manages fields", async () => {
		const testDb = createTestDb()
		const caller = createTestCaller(testDb)

		try {
			const created = await caller.collections.create({
				name: "  News Articles  ",
				description: "Company updates",
			})

			expect(created.name).toBe("News Articles")
			expect(created.slug).toBe("news-articles")

			const secondId = seedCollection(testDb.connection, { name: "Docs", slug: "docs" })
			const listed = await caller.collections.list()

			expect(listed.map((collection) => collection.id)).toEqual(
				expect.arrayContaining([created.id, secondId]),
			)

			const firstField = await caller.collections.addField({
				collectionId: created.id,
				name: "Title",
				type: "text",
				required: true,
			})
			const secondField = await caller.collections.addField({
				collectionId: created.id,
				name: "Hero Image",
				type: "image",
				required: false,
			})

			expect(firstField.sortOrder).toBe(0)
			expect(secondField.sortOrder).toBe(1)

			const loaded = await caller.collections.getById({ id: created.id })
			expect(loaded?.fields.map((field) => field.slug)).toEqual(["title", "hero-image"])

			const updated = await caller.collections.update({
				id: created.id,
				name: "Announcements",
				slug: "announcements",
				description: "Release notes",
			})

			expect(updated?.name).toBe("Announcements")

			const updatedField = await caller.collections.updateField({
				id: firstField.id,
				name: "Headline",
				type: "richtext",
				required: false,
			})

			expect(updatedField?.name).toBe("Headline")
			expect(updatedField?.type).toBe("richtext")

			await caller.collections.reorderFields([
				{ id: firstField.id, sortOrder: 2 },
				{ id: secondField.id, sortOrder: 1 },
			])

			const reordered = await caller.collections.getById({ id: created.id })
			expect(reordered?.fields.map((field) => field.sortOrder)).toEqual([1, 2])

			await caller.collections.removeField({ id: secondField.id })
			expect((await caller.collections.getById({ id: created.id }))?.fields).toHaveLength(1)

			await caller.collections.delete({ id: created.id })
			expect(await caller.collections.getById({ id: created.id })).toBeUndefined()

			seedCollectionField(testDb.connection, { collectionId: secondId, name: "Body", slug: "body" })
			expect((await caller.collections.getById({ id: secondId }))?.fields).toHaveLength(1)
		} finally {
			destroyTestDb(testDb.connection)
		}
	})
})
