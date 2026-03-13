import { createTRPCContext } from "@trpc/tanstack-react-query"
import type { AnyTRPCRouter } from "@trpc/server"

export function createGearuTRPCReact<TRouter extends AnyTRPCRouter>(): ReturnType<typeof createTRPCContext<TRouter>> {
	return createTRPCContext<TRouter>()
}
