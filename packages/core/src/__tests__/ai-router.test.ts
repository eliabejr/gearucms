import { createTestCaller } from "../../../../tests/helpers/trpc-caller"
import {
	createTestDb,
	destroyTestDb,
	seedAiJob,
	seedAiJobItem,
	seedAiUsageLog,
	seedCollection,
} from "../../../../tests/helpers/test-db"

describe("ai router", () => {
	it("creates jobs, updates statuses, logs usage, and aggregates stats", async () => {
		const testDb = createTestDb()
		const caller = createTestCaller(testDb)

		try {
			const collectionId = seedCollection(testDb.connection, { name: "Blog", slug: "blog" })

			const job = await caller.ai.createJob({
				collectionId,
				imageMode: "pexels",
				csvRows: [
					{ title: "Post One", schedule: 0 },
					{ title: "Post Two", schedule: 3 },
				],
			})

			const createdJob = await caller.ai.getJob({ id: job.id })
			expect(createdJob?.items).toHaveLength(2)
			expect(createdJob?.collection?.id).toBe(collectionId)

			const listed = await caller.ai.listJobs()
			expect(listed[0]?.id).toBe(job.id)

			await caller.ai.updateJobStatus({ id: job.id, status: "processing" })
			await caller.ai.updateJobStatus({ id: job.id, status: "completed" })

			const createdItem = createdJob!.items[0]!
			const updatedItem = await caller.ai.updateJobItem({
				id: createdItem.id,
				status: "completed",
				generatedText: "<p>Generated</p>",
				generatedImageUrl: "/generated.png",
				tokensUsed: 120,
				imageTokensUsed: 25,
			})
			expect(updatedItem.completedAt).toBeInstanceOf(Date)

			const usage = await caller.ai.logUsage({
				jobId: job.id,
				jobItemId: createdItem.id,
				provider: "openai",
				model: "gpt-4o-mini",
				type: "text",
				tokensInput: 100,
				tokensOutput: 250,
				costEstimate: "0.12",
			})
			expect(usage.provider).toBe("openai")

			const historicalJobId = seedAiJob(testDb.connection, {
				collectionId,
				status: "completed",
			})
			const historicalItemId = seedAiJobItem(testDb.connection, {
				jobId: historicalJobId,
				status: "completed",
			})

			seedAiUsageLog(testDb.connection, {
				jobId: historicalJobId,
				jobItemId: historicalItemId,
				provider: "anthropic",
				type: "text",
				tokensInput: 40,
				tokensOutput: 60,
			})
			seedAiUsageLog(testDb.connection, {
				jobId: historicalJobId,
				jobItemId: historicalItemId,
				provider: "openai",
				type: "image",
				tokensInput: 10,
				tokensOutput: 0,
			})

			const stats = await caller.ai.getUsageStats({ days: 30 })
			expect(stats.today.totalInput).toBeGreaterThan(0)
			expect(stats.period.totalOutput).toBeGreaterThan(0)
			expect(stats.byProvider).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ provider: "openai" }),
					expect.objectContaining({ provider: "anthropic" }),
				]),
			)
		} finally {
			destroyTestDb(testDb.connection)
		}
	})
})
