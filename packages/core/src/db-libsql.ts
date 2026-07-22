import type { Client } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import type { LibSQLDatabase } from "drizzle-orm/libsql"
import { buildGearuSchema, type CoreSchema, type CreateDbOptions } from "./db-schema"

/**
 * Create a web-compatible Drizzle database backed by libSQL/Turso.
 *
 * Import this factory from `@gearu/core/db/libsql`; that entry point never
 * evaluates the native `better-sqlite3` driver.
 */
export function createLibSqlDb(
	client: Client,
	options: CreateDbOptions = {},
): LibSQLDatabase<CoreSchema> {
	const schema = buildGearuSchema(options.plugins) as CoreSchema
	return drizzle(client, { schema }) as LibSQLDatabase<CoreSchema>
}
