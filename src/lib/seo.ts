/**
 * Re-exports SEO utilities from @gearu/core.
 * App code can import from here or directly from @gearu/core.
 */
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
} from "@gearu/core"

export type { SeoMeta, SeoCheck, SeoScore } from "@gearu/core"
