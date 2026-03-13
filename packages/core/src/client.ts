/**
 * Client-safe entrypoint for use in browser/admin bundles.
 * Do not export db, schema, or any server-only modules from here.
 */
export { definePlugin } from "./plugin"
export type {
  GearuPlugin,
  GearuPluginNavItem,
  GearuPluginAdminRoute,
  GearuPluginRootComponent,
  GearuPluginTRPCRouter,
} from "./plugin"
export {
  OPTIONAL_ADMIN_MODULES,
  getOptionalModuleByPath,
  type OptionalAdminModule,
} from "./optionalModules"
export { calculateSeoScore } from "./seo"
export type { SeoScore, SeoCheck } from "./seo"
