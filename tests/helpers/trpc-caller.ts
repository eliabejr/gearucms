import { createGearuTRPC, createGearuRouterRecord } from "../../packages/core/src/trpc/index"
import type { TestDatabase } from "./test-db"

export interface TestSession {
	user?: {
		id?: string
		name?: string
		email?: string
	}
}

const trpc = createGearuTRPC<{ headers: Headers; session: TestSession | null }>()

const appRouter = trpc.createTRPCRouter(
	createGearuRouterRecord({
		db: null as never,
		publicProcedure: trpc.publicProcedure,
		protectedProcedure: trpc.protectedProcedure,
		TRPCError: trpc.TRPCError,
	}),
)

export type TestCaller = ReturnType<typeof createTestCaller>

export function createTestCaller(
	testDb: Pick<TestDatabase, "db">,
	session: TestSession | null = { user: { id: "user-1", name: "Test User", email: "test@example.com" } },
) {
	const router = trpc.createTRPCRouter(
		createGearuRouterRecord({
			db: testDb.db,
			publicProcedure: trpc.publicProcedure,
			protectedProcedure: trpc.protectedProcedure,
			TRPCError: trpc.TRPCError,
		}),
	)

	return router.createCaller({
		headers: new Headers(),
		session,
	})
}

export function createUnauthorizedCaller(testDb: Pick<TestDatabase, "db">) {
	return createTestCaller(testDb, null)
}

export { appRouter }
