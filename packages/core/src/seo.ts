/** Site URL resolved from environment. */
export function getSiteUrl(): string {
  const url = process.env.SITE_URL || "http://localhost:3000"
  return url.replace(/\/$/, "")
}

// ---------------------------------------------------------------------------
// Meta tags
// ---------------------------------------------------------------------------

export interface SeoMeta {
  title: string
  description: string
  canonical: string
  ogImage?: string
  ogType?: string
  publishedAt?: string
  modifiedAt?: string
  author?: string
  section?: string
  siteName?: string
}

/** Generate a complete set of meta tags for a page. */
export function generateMetaTags(meta: SeoMeta) {
  const siteUrl = getSiteUrl()
  const siteName = meta.siteName ?? "Gearu"
  const ogImage =
    meta.ogImage ||
    `${siteUrl}/api/og-image?title=${encodeURIComponent(meta.title)}`

  return [
    { title: meta.title },
    { name: "description", content: meta.description },
    { tagName: "link", rel: "canonical", href: meta.canonical },
    { property: "og:title", content: meta.title },
    { property: "og:description", content: meta.description },
    { property: "og:url", content: meta.canonical },
    { property: "og:image", content: ogImage },
    { property: "og:type", content: meta.ogType || "website" },
    { property: "og:site_name", content: siteName },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: meta.title },
    { name: "twitter:description", content: meta.description },
    { name: "twitter:image", content: ogImage },
    ...(meta.publishedAt
      ? [{ property: "article:published_time", content: meta.publishedAt }]
      : []),
    ...(meta.modifiedAt
      ? [{ property: "article:modified_time", content: meta.modifiedAt }]
      : []),
    ...(meta.section
      ? [{ property: "article:section", content: meta.section }]
      : []),
  ]
}

// ---------------------------------------------------------------------------
// Structured data (JSON-LD)
// ---------------------------------------------------------------------------

/** Generate BlogPosting JSON-LD for an article/entry. */
export function generateArticleJsonLd(opts: {
  title: string
  description: string
  url: string
  publishedAt: string
  modifiedAt?: string
  image?: string
  author?: string
  section?: string
  siteName?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.publishedAt,
    ...(opts.modifiedAt && { dateModified: opts.modifiedAt }),
    ...(opts.image && { image: { "@type": "ImageObject", url: opts.image } }),
    author: { "@type": "Person", name: opts.author || "Author" },
    publisher: { "@type": "Organization", name: opts.siteName ?? "Gearu" },
    ...(opts.section && { articleSection: opts.section }),
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
  }
}

/** Generate BreadcrumbList JSON-LD. */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** Generate Organization JSON-LD. */
export function generateOrganizationJsonLd(opts: {
  name: string
  url: string
  logo?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name,
    url: opts.url,
    ...(opts.logo && { logo: opts.logo }),
  }
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

/** Strip all HTML tags from a string, returning plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/** Extract a plain-text excerpt from HTML content. */
export function extractExcerpt(html: string, maxLength = 160): string {
  const text = stripHtml(html)
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3).replace(/\s+\S*$/, "") + "..."
}

/** Extract the first `<img>` src from HTML content. */
export function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/)
  return match?.[1] ?? null
}

// ---------------------------------------------------------------------------
// SEO scoring
// ---------------------------------------------------------------------------

export interface SeoCheck {
  id: string
  label: string
  status: "good" | "warning" | "error"
  message: string
}

export interface SeoScore {
  score: number
  checks: SeoCheck[]
}

/** Calculate an SEO score based on content quality signals. */
export function calculateSeoScore(opts: {
  title: string
  metaDescription: string
  content: string
  slug: string
  hasImage: boolean
}): SeoScore {
  const checks: SeoCheck[] = []

  const titleLen = opts.title.length
  if (titleLen >= 50 && titleLen <= 60) {
    checks.push({ id: "title-length", label: "Title length", status: "good", message: `Title is ${titleLen} chars (ideal: 50–60)` })
  } else if (titleLen >= 30 && titleLen <= 70) {
    checks.push({ id: "title-length", label: "Title length", status: "warning", message: `Title is ${titleLen} chars (ideal: 50–60)` })
  } else {
    checks.push({ id: "title-length", label: "Title length", status: "error", message: `Title is ${titleLen} chars (ideal: 50–60)` })
  }

  const descLen = opts.metaDescription.length
  if (descLen >= 120 && descLen <= 160) {
    checks.push({ id: "meta-desc-length", label: "Meta description", status: "good", message: `Description is ${descLen} chars (ideal: 120–160)` })
  } else if (descLen > 0 && descLen < 120) {
    checks.push({ id: "meta-desc-length", label: "Meta description", status: "warning", message: `Description is ${descLen} chars — could be longer (ideal: 120–160)` })
  } else if (descLen === 0) {
    checks.push({ id: "meta-desc-length", label: "Meta description", status: "error", message: "Meta description is missing" })
  } else {
    checks.push({ id: "meta-desc-length", label: "Meta description", status: "warning", message: `Description is ${descLen} chars — too long (ideal: 120–160)` })
  }

  const plainText = stripHtml(opts.content)
  const wordCount = plainText.split(/\s+/).filter(Boolean).length
  if (wordCount >= 300) {
    checks.push({ id: "content-length", label: "Content length", status: "good", message: `${wordCount} words (minimum: 300)` })
  } else if (wordCount >= 100) {
    checks.push({ id: "content-length", label: "Content length", status: "warning", message: `${wordCount} words — consider adding more (minimum: 300)` })
  } else {
    checks.push({ id: "content-length", label: "Content length", status: "error", message: `${wordCount} words — too short (minimum: 300)` })
  }

  const headingCount = (opts.content.match(/<h[2-3][^>]*>/gi) || []).length
  if (headingCount >= 2) {
    checks.push({ id: "headings", label: "Headings", status: "good", message: `${headingCount} subheadings found` })
  } else if (headingCount === 1) {
    checks.push({ id: "headings", label: "Headings", status: "warning", message: "Only 1 subheading — consider adding more for structure" })
  } else {
    checks.push({ id: "headings", label: "Headings", status: "error", message: "No subheadings — add h2/h3 to structure content" })
  }

  if (opts.hasImage) {
    checks.push({ id: "has-image", label: "Featured image", status: "good", message: "Post has an image" })
  } else {
    checks.push({ id: "has-image", label: "Featured image", status: "warning", message: "No image — consider adding one for engagement" })
  }

  if (opts.slug && !opts.slug.includes("_") && opts.slug.length <= 75) {
    checks.push({ id: "slug", label: "URL slug", status: "good", message: "Clean, readable slug" })
  } else if (opts.slug.length > 75) {
    checks.push({ id: "slug", label: "URL slug", status: "warning", message: "Slug is long — consider shortening" })
  } else {
    checks.push({ id: "slug", label: "URL slug", status: "warning", message: "Slug uses underscores — prefer hyphens" })
  }

  const linkCount = (opts.content.match(/<a[^>]+href=/gi) || []).length
  if (linkCount > 0) {
    checks.push({ id: "internal-links", label: "Links", status: "good", message: `${linkCount} link(s) found in content` })
  } else {
    checks.push({ id: "internal-links", label: "Links", status: "warning", message: "No links in content — consider adding internal links" })
  }

  const maxPoints = checks.length * 2
  const points = checks.reduce(
    (sum, c) => (c.status === "good" ? sum + 2 : c.status === "warning" ? sum + 1 : sum),
    0,
  )
  const score = Math.round((points / maxPoints) * 100)

  return { score, checks }
}

// ---------------------------------------------------------------------------
// Auto internal linking
// ---------------------------------------------------------------------------

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Inject internal links into HTML content for matching keywords. */
export function autoInternalLink(
  html: string,
  keywords: Array<{ keyword: string; url: string }>,
  maxLinksPerKeyword = 1,
): string {
  let result = html
  for (const { keyword, url } of keywords) {
    const regex = new RegExp(
      `(?<![<][^>]*)(\\b${escapeRegex(keyword)}\\b)(?![^<]*>)(?![^<a]*</a)`,
      "gi",
    )
    let count = 0
    result = result.replace(regex, (match) => {
      if (count >= maxLinksPerKeyword) return match
      count++
      return `<a href="${url}" title="${keyword}">${match}</a>`
    })
  }
  return result
}

// ---------------------------------------------------------------------------
// Search engine pinging
// ---------------------------------------------------------------------------

/** Ping IndexNow API with updated URLs. Requires INDEXNOW_API_KEY env var. */
export async function pingIndexNow(urls: string[]): Promise<boolean> {
  const apiKey = process.env.INDEXNOW_API_KEY
  if (!apiKey) return false
  const siteUrl = getSiteUrl()
  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: new URL(siteUrl).hostname,
        key: apiKey,
        urlList: urls,
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

/** Ping Google with the sitemap URL (best-effort). */
export async function pingSitemap(): Promise<void> {
  const siteUrl = getSiteUrl()
  const sitemapUrl = `${siteUrl}/api/sitemap`
  try {
    await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    )
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Crawler detection
// ---------------------------------------------------------------------------

const CRAWLER_UAS = [
  "Googlebot", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider",
  "YandexBot", "facebookexternalhit", "Twitterbot", "LinkedInBot",
]

/** Check if a user-agent string belongs to a known crawler. */
export function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false
  return CRAWLER_UAS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase()),
  )
}

// ---------------------------------------------------------------------------
// Entry helpers (for $collection/$slug pages)
// ---------------------------------------------------------------------------

interface EntryField {
  field: { name: string; slug: string; type: string }
  value: string | null
}

interface EntryData {
  title: string
  slug: string
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: string | null
  publishedAt?: Date | string | null
  updatedAt?: Date | string | null
  collection?: { name: string; slug: string } | null
  fields?: EntryField[] | null
}

/** Prepare meta tags from an entry. Returns TanStack Router `head.meta` array. */
export function prepareEntryMeta(entry: EntryData, siteUrl: string) {
  const collectionSlug = entry.collection?.slug ?? ""
  const canonical = `${siteUrl}/${collectionSlug}/${entry.slug}`

  const contentFields = (entry.fields ?? [])
    .filter((f) => f.field.type === "richtext" || f.field.type === "text")
    .map((f) => f.value ?? "")
    .join(" ")

  const description = entry.metaDescription || extractExcerpt(contentFields)

  const imageField = (entry.fields ?? []).find(
    (f) => f.field.type === "image" && f.value,
  )
  const ogImage =
    entry.ogImage || imageField?.value || extractFirstImage(contentFields)

  const metaTitle = entry.metaTitle || entry.title

  return generateMetaTags({
    title: metaTitle,
    description,
    canonical,
    ogImage: ogImage ?? undefined,
    ogType: "article",
    publishedAt: entry.publishedAt
      ? new Date(entry.publishedAt as string).toISOString()
      : undefined,
    modifiedAt: entry.updatedAt
      ? new Date(entry.updatedAt as string).toISOString()
      : undefined,
    section: entry.collection?.name,
  })
}

/** Prepare article JSON-LD from an entry. */
export function prepareEntryJsonLd(entry: EntryData, siteUrl: string) {
  const collectionSlug = entry.collection?.slug ?? ""
  const canonical = `${siteUrl}/${collectionSlug}/${entry.slug}`

  const contentFields = (entry.fields ?? [])
    .filter((f) => f.field.type === "richtext" || f.field.type === "text")
    .map((f) => f.value ?? "")
    .join(" ")

  const description = entry.metaDescription || extractExcerpt(contentFields)

  return generateArticleJsonLd({
    title: entry.metaTitle || entry.title,
    description,
    url: canonical,
    publishedAt: entry.publishedAt
      ? new Date(entry.publishedAt as string).toISOString()
      : new Date().toISOString(),
    modifiedAt: entry.updatedAt
      ? new Date(entry.updatedAt as string).toISOString()
      : undefined,
    image: entry.ogImage ?? undefined,
    section: entry.collection?.name,
  })
}
