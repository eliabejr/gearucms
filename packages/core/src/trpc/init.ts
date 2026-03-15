import { TRPCError, initTRPC } from "@trpc/server"
import type { TRPCBuiltRouter, TRPCRouterRecord } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"
import { getUserFacingErrorMessage } from "./error-handler"

export interface GearuTRPCContext<TSession = { user?: unknown }> {
	headers: Headers
	session: TSession | null
}

export interface GearuTRPCFactoryResult {
	TRPCError: typeof TRPCError
	createTRPCRouter: <TRecord extends TRPCRouterRecord>(input: TRecord) => TRPCBuiltRouter<any, TRecord>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	publicProcedure: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protectedProcedure: any
}

/**
 * Creates the shared tRPC primitives Gearu expects on the host app.
 */
export function createGearuTRPC<TContext extends GearuTRPCContext = GearuTRPCContext>(): GearuTRPCFactoryResult {
	const t = initTRPC.context<TContext>().create({
		transformer: superjson,
		errorFormatter({ shape, error }) {
			const userMessage = getUserFacingErrorMessage(error)
			const zodError = error.cause instanceof ZodError ? error.cause.flatten() : null

			return {
				...shape,
				message: userMessage,
				data: {
					...shape.data,
					userMessage,
					zodError,
				},
			}
		},
	})

	const publicProcedure = t.procedure
	const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
		const session = (ctx as GearuTRPCContext).session
		if (!session || typeof session !== "object" || !("user" in session) || !session.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" })
		}

		return next({ ctx })
	})

	return {
		TRPCError,
		createTRPCRouter: t.router,
		publicProcedure,
		protectedProcedure,
	} as GearuTRPCFactoryResult
}
