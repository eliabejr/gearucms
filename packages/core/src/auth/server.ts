import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { betterAuth } from "better-auth"
import type { BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import type { CoreSchema } from "../db"
import { account, session, user, verification } from "../schema/index"

export interface CreateGearuAuthOptions {
	emailAndPassword?: Record<string, unknown> & { enabled?: boolean }
	plugins?: BetterAuthPlugin[]
	[key: string]: unknown
}

export interface GearuAuthSessionApi {
	api: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		getSession: (options: { headers: Headers }) => Promise<any>
	}
}

export interface GearuAuthServerHelpers {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getSession: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ensureSession: any
}

/**
 * Creates a Better Auth instance pre-wired to Gearu's auth tables.
 * Host apps can still extend the config with providers, hooks, plugins, and secrets.
 */
export function createGearuAuth(
	db: BetterSQLite3Database<CoreSchema>,
	options: CreateGearuAuthOptions = {},
) {
	const { emailAndPassword, plugins = [], ...rest } = options

	return betterAuth({
		...(rest as Record<string, unknown>),
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: {
				user,
				session,
				account,
				verification,
			},
		}),
		emailAndPassword: {
			enabled: true,
			...(emailAndPassword ?? {}),
		},
		plugins: [...plugins, tanstackStartCookies()],
	})
}

/**
 * Creates reusable TanStack Start server helpers for protected routes and server functions.
 */
export function createGearuAuthServerHelpers(
	auth: GearuAuthSessionApi,
): GearuAuthServerHelpers {
	const getSession = createServerFn({ method: "GET" }).handler(async () => {
		return (await auth.api.getSession({ headers: getRequestHeaders() })) as any
	})

	const ensureSession = createServerFn({ method: "GET" }).handler(async () => {
		const session = (await auth.api.getSession({ headers: getRequestHeaders() })) as any
		if (!session) {
			throw new Error("Unauthorized")
		}
		return session
	})

	return {
		getSession: getSession as GearuAuthServerHelpers["getSession"],
		ensureSession: ensureSession as GearuAuthServerHelpers["ensureSession"],
	}
}
