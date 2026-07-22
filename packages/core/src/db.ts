import { drizzle } from "drizzle-orm/better-sqlite3"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { buildGearuSchema, type CoreSchema, type CreateDbOptions } from "./db-schema"

/**
 * Create Drizzle db instance. Pass a better-sqlite3 Database instance (caller creates it from DATABASE_URL).
 * When plugins are provided, their schema tables are merged for relations.
 */
export function createDb(
  connection: import("better-sqlite3").Database,
  options: CreateDbOptions = {},
): BetterSQLite3Database<CoreSchema> {
  const schema = buildGearuSchema(options.plugins) as CoreSchema
  return drizzle(connection, { schema }) as BetterSQLite3Database<CoreSchema>
}

export type { CoreSchema, CreateDbOptions }
