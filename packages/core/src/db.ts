import { drizzle } from "drizzle-orm/better-sqlite3"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import * as coreSchema from "./schema/index"
import * as coreRelations from "./schema/relations"
import type { GearuPlugin } from "./plugin"

type CoreSchema = typeof coreSchema & typeof coreRelations

/**
 * Build merged schema from core + plugin tables.
 */
function mergeSchema(
  pluginSchemas: Record<string, import("drizzle-orm/sqlite-core").AnySQLiteTable>[],
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...coreSchema, ...coreRelations }
  for (const schemas of pluginSchemas) {
    for (const [key, value] of Object.entries(schemas)) {
      if (value && typeof value === "object" && "name" in value) {
        merged[key] = value
      }
    }
  }
  return merged
}

export interface CreateDbOptions {
  /** Plugins to merge schema from (optional) */
  plugins?: GearuPlugin[]
}

/**
 * Create Drizzle db instance. Pass a better-sqlite3 Database instance (caller creates it from DATABASE_URL).
 * When plugins are provided, their schema tables are merged for relations.
 */
export function createDb(
  connection: import("better-sqlite3").Database,
  options: CreateDbOptions = {},
): BetterSQLite3Database<CoreSchema> {
  const pluginSchemas: Record<string, import("drizzle-orm/sqlite-core").AnySQLiteTable>[] = (
    options.plugins ?? []
  )
    .filter((p): p is GearuPlugin & { schema: NonNullable<GearuPlugin["schema"]> } => !!p.schema)
    .map((p) => p.schema as Record<string, import("drizzle-orm/sqlite-core").AnySQLiteTable>)
  const schema = mergeSchema(pluginSchemas) as CoreSchema
  return drizzle(connection, { schema }) as BetterSQLite3Database<CoreSchema>
}

export type { CoreSchema }
