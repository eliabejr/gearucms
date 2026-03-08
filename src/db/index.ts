/**
 * Database connection module
 *
 * Development:  Uses better-sqlite3 with a local .db file (DATABASE_URL env var)
 * Production:   Uses Cloudflare D1 (see index.d1.ts)
 *
 * For Cloudflare deployment, update the Nitro config to alias this module:
 *   nitro({ alias: { '#/db/index': '#/db/index.d1' } })
 *
 * Or set the build command to use the Cloudflare-specific build:
 *   npm run build:cf
 */
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"
import * as relations from "./relations"

export const db = drizzle(process.env.DATABASE_URL!, {
	schema: { ...schema, ...relations },
})
