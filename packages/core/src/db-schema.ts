import type { AnySQLiteTable } from "drizzle-orm/sqlite-core"
import * as coreRelations from "./schema/relations"
import * as coreSchema from "./schema/index"
import type { GearuPlugin } from "./plugin"

export type CoreSchema = typeof coreSchema & typeof coreRelations
export type GearuSchema = Record<string, unknown>

export interface CreateDbOptions {
	/** Plugins to merge schema from (optional). */
	plugins?: GearuPlugin[]
}

/**
 * Merge the core schema with tables supplied by Gearu plugins.
 *
 * This module deliberately contains no database driver imports, so it is safe
 * to use from Workers and other edge runtimes.
 */
export function buildGearuSchema(plugins: GearuPlugin[] = []): GearuSchema {
	const merged: GearuSchema = { ...coreSchema, ...coreRelations }

	for (const plugin of plugins) {
		if (!plugin.schema) continue
		for (const [key, value] of Object.entries(plugin.schema as Record<string, AnySQLiteTable>)) {
			if (value && typeof value === "object" && "name" in value) {
				merged[key] = value
			}
		}
	}

	return merged
}
