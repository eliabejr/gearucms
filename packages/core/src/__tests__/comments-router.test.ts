import { createTestCaller } from "../../../../tests/helpers/trpc-caller"
import {
	createTestDb,
	destroyTestDb,
	seedCollection,
	seedComment,
	seedEntry,
} from "../../../../tests/helpers/test-db"

describe("comments router", () => {
	it("supports public submission plus moderation actions", async () => {
		const testDb = createTestDb()
		const caller = createTestCaller(testDb)

		try {
			const collectionId = seedCollection(testDb.connection, { slug: "blog" })
			const entryId = seedEntry(testDb.connection, { collectionId, title: "Hello", slug: "hello", status: "published" })

			const submitted = await caller.comments.submit({
				entryId,
				authorName: "Jane Doe",
				authorEmail: "jane@example.com",
				content: "Nice article",
			})

			expect(submitted.status).toBe("pending")

			const approvedId = seedComment(testDb.connection, { entryId, status: "approved", content: "Approved comment" })
			seedComment(testDb.connection, { entryId, status: "rejected", content: "Rejected comment" })

			expect(await caller.comments.list()).toHaveLength(3)
			expect(await caller.comments.list({ status: "pending" })).toHaveLength(1)
			expect(await caller.comments.list({ status: "approved" })).toHaveLength(1)
			expect(await caller.comments.getByEntry({ entryId })).toHaveLength(3)

			const moderated = await caller.comments.moderate({ id: submitted.id, status: "approved" })
			expect(moderated.status).toBe("approved")

			await caller.comments.moderate({ id: approvedId, status: "rejected" })
			expect(await caller.comments.list({ status: "rejected" })).toHaveLength(2)

			await caller.comments.delete({ id: submitted.id })
			expect(await caller.comments.getByEntry({ entryId })).toHaveLength(2)
		} finally {
			destroyTestDb(testDb.connection)
		}
	})
})
