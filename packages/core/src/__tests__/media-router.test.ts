import { createTestCaller } from "../../../../tests/helpers/trpc-caller"
import {
	createTestDb,
	destroyTestDb,
	seedMedia,
} from "../../../../tests/helpers/test-db"

describe("media router", () => {
	it("lists, filters, reads, and deletes media items", async () => {
		const testDb = createTestDb()
		const caller = createTestCaller(testDb)

		try {
			const imageId = seedMedia(testDb.connection, {
				filename: "hero.jpg",
				url: "uploads/hero.jpg",
				mimeType: "image/jpeg",
			})
			seedMedia(testDb.connection, {
				filename: "manual.pdf",
				url: "uploads/manual.pdf",
				mimeType: "application/pdf",
			})

			expect(await caller.media.list()).toHaveLength(2)
			expect(await caller.media.list({ mimeType: "image/jpeg" })).toHaveLength(1)
			expect(await caller.media.getById({ id: imageId })).toMatchObject({
				filename: "hero.jpg",
			})

			await expect(caller.media.delete({ id: imageId })).resolves.toEqual({ success: true })
			expect(await caller.media.getById({ id: imageId })).toBeUndefined()
		} finally {
			destroyTestDb(testDb.connection)
		}
	})
})
