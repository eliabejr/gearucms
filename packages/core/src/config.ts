/**
 * Gearu config schema (optional validation with zod if needed).
 * gearu.config.ts in the user project should export a default object matching this type.
 */
export interface GearuConfig {
  /** Database connection URL (e.g. file path for SQLite or D1 binding name) */
  database: string | { url?: string; [key: string]: unknown }
  /** Plugin package names or ids to load, e.g. ["@gearu/plugin-leads", "@gearu/plugin-analytics"] */
  plugins?: string[]
  /** Optional plugin options keyed by plugin id */
  pluginOptions?: Record<string, unknown>
}

/**
 * Resolved config after loading gearu.config and env.
 */
export interface ResolvedGearuConfig extends GearuConfig {
  databaseUrl: string
}

const defaultConfig: GearuConfig = {
  database: process.env.DATABASE_URL ?? "file:./dev.db",
  plugins: [],
}

/**
 * Load config from a provided object (e.g. from dynamic import of gearu.config.ts).
 */
export function resolveConfig(config: Partial<GearuConfig> = {}): ResolvedGearuConfig {
  const merged = { ...defaultConfig, ...config }
  const databaseUrl =
    typeof merged.database === "string"
      ? merged.database
      : (merged.database?.url ?? process.env.DATABASE_URL ?? "file:./dev.db")
  return {
    ...merged,
    databaseUrl,
  }
}
