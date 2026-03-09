export { resolveConfig } from "./config"
export type { GearuConfig, ResolvedGearuConfig } from "./config"
export { definePlugin } from "./plugin"
export type {
  GearuPlugin,
  GearuPluginNavItem,
  GearuPluginAdminRoute,
  GearuPluginRootComponent,
  GearuPluginTRPCRouter,
} from "./plugin"
export { createDb } from "./db"
export type { CreateDbOptions, CoreSchema } from "./db"
export type { GearuContext } from "./context"
export * from "./schema/index"
export * from "./schema/relations"
export {
  OPTIONAL_ADMIN_MODULES,
  getOptionalModuleByPath,
  type OptionalAdminModule,
} from "./optionalModules"

// SEO & content utilities
export {
  getSiteUrl,
  generateMetaTags,
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
  generateOrganizationJsonLd,
  stripHtml,
  extractExcerpt,
  extractFirstImage,
  calculateSeoScore,
  autoInternalLink,
  pingIndexNow,
  pingSitemap,
  isCrawler,
  prepareEntryMeta,
  prepareEntryJsonLd,
} from "./seo"
export type { SeoMeta, SeoCheck, SeoScore } from "./seo"

// Robots, sitemap, OG image generators
export { generateRobotsTxt } from "./robots"
export type { RobotsTxtOptions } from "./robots"
export { generateSitemapXml } from "./sitemap"
export type { SitemapEntry } from "./sitemap"
export { generateOgImageSvg, escapeXml } from "./og-image"
