import type { AnySQLiteTable } from "drizzle-orm/sqlite-core"
import type { ComponentType } from "react"

/** tRPC sub-router shape (record of procedures). Plugins export this for the app to merge. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GearuPluginTRPCRouter = Record<string, any>

/** Nav item for the admin sidebar (path is relative to /admin) */
export interface GearuPluginNavItem {
  path: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
}

/** Admin route registration: path + React component */
export interface GearuPluginAdminRoute {
  path: string
  Component: ComponentType
}

/** Optional root components (e.g. PageTracker) to render in the app root */
export interface GearuPluginRootComponent {
  Component: ComponentType
  /** Optional order for rendering (lower first) */
  order?: number
}

/**
 * Plugin contract for Gearu.
 * Plugins export this via definePlugin().
 */
export interface GearuPlugin {
  id: string
  name: string
  version: string
  /** Optional: Drizzle tables to merge into the main schema */
  schema?: Record<string, AnySQLiteTable>
  /** Optional: tRPC sub-router to merge under a key (e.g. "leads" => appRouter.leads) */
  trpcRouter?: GearuPluginTRPCRouter
  /** Admin nav item and route */
  admin?: {
    navItem: GearuPluginNavItem
    route: GearuPluginAdminRoute
  }
  /** Optional components to render in the app root (e.g. analytics PageTracker) */
  rootComponents?: GearuPluginRootComponent[]
}

/**
 * Define a Gearu plugin. Use in plugin packages: export default definePlugin({ ... })
 */
export function definePlugin(plugin: GearuPlugin): GearuPlugin {
  return plugin
}
