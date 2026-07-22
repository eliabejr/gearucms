import type { ResolvedGearuConfig } from "./config"
import type { GearuPlugin } from "./plugin"

/**
 * Runtime context for Gearu: config, db, and registered plugins.
 * Built by the app after loading gearu.config and resolving plugins.
 */
export interface GearuContext {
  config: ResolvedGearuConfig
  /** Any SQLite-compatible Drizzle database, including libSQL and better-sqlite3. */
  db: unknown
  plugins: GearuPlugin[]
  /** Auth instance is app-specific (better-auth); not created by core */
  auth?: unknown
}
