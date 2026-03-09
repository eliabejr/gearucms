import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import type { ResolvedGearuConfig } from "./config"
import type { GearuPlugin } from "./plugin"
import type { CoreSchema } from "./db"

/**
 * Runtime context for Gearu: config, db, and registered plugins.
 * Built by the app after loading gearu.config and resolving plugins.
 */
export interface GearuContext {
  config: ResolvedGearuConfig
  db: BetterSQLite3Database<CoreSchema>
  plugins: GearuPlugin[]
  /** Auth instance is app-specific (better-auth); not created by core */
  auth?: unknown
}
