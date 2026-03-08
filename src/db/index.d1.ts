/**
 * Cloudflare D1 database driver
 *
 * Used in production when deployed to Cloudflare Workers.
 * The D1 binding is available via globalThis.__env__.DB
 * which is set by Nitro's Cloudflare worker entry point.
 *
 * For local development with D1 simulation, use: npx wrangler dev
 */
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./schema"
import * as relations from "./relations"

/**
 * Get the D1 database binding from the Cloudflare Workers environment.
 * In Nitro's Cloudflare preset, bindings are exposed via globalThis.__env__
 */
function getD1Binding(): D1Database {
	const env = (globalThis as any).__env__
	if (!env?.DB) {
		throw new Error(
			"D1 database binding not found. Make sure the D1 binding is configured in wrangler.toml " +
				"and you are running in a Cloudflare Workers environment.",
		)
	}
	return env.DB
}

export const db = drizzle(getD1Binding(), {
	schema: { ...schema, ...relations },
})
