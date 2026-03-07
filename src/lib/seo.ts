// ─── SEO Utilities ──────────────────────────────────────────

const SITE_URL = process.env.SITE_URL || "http://localhost:3000"

export function getSiteUrl(): string {
	return SITE_URL.replace(/\/$/, "")
}

// ─── Meta tag generation ────────────────────────────────────

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
}

export function generateMetaTags(meta: SeoMeta) {
	const siteUrl = getSiteUrl()
	const ogImage = meta.ogImage || `${siteUrl}/api/og-image?title=${encodeURIComponent(meta.title)}`

	return [
		{ title: meta.title },
		{ name: "description", content: meta.description },
		// Canonical
		{ tagName: "link", rel: "canonical", href: meta.canonical },
		// OpenGraph
		{ property: "og:title", content: meta.title },
		{ property: "og:description", content: meta.description },
		{ property: "og:url", content: meta.canonical },
		{ property: "og:image", content: ogImage },
		{ property: "og:type", content: meta.ogType || "website" },
		{ property: "og:site_name", content: "CMS" },
		// Twitter
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: meta.title },
		{ name: "twitter:description", content: meta.description },
		{ name: "twitter:image", content: ogImage },
		// Article-specific
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

// ─── Structured data (JSON-LD) ──────────────────────────────

export function generateArticleJsonLd(opts: {
	title: string
	description: string
	url: string
	publishedAt: string
	modifiedAt?: string
	image?: string
	author?: string
	section?: string
}) {
	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: opts.title,
		description: opts.description,
		url: opts.url,
		datePublished: opts.publishedAt,
		...(opts.modifiedAt && { dateModified: opts.modifiedAt }),
		...(opts.image && {
			image: {
				"@type": "ImageObject",
				url: opts.image,
			},
		}),
		author: {
			"@type": "Person",
			name: opts.author || "Author",
		},
		publisher: {
			"@type": "Organization",
			name: "CMS",
		},
		...(opts.section && { articleSection: opts.section }),
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": opts.url,
		},
	}
}

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

// ─── HTML text extraction ───────────────────────────────────

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

export function extractExcerpt(html: string, maxLength = 160): string {
	const text = stripHtml(html)
	if (text.length <= maxLength) return text
	return text.substring(0, maxLength - 3).replace(/\s+\S*$/, "") + "..."
}

export function extractFirstImage(html: string): string | null {
	const match = html.match(/<img[^>]+src=["']([^"']+)["']/)
	return match?.[1] ?? null
}

// ─── SEO Score Calculator ───────────────────────────────────

export interface SeoScore {
	score: number // 0-100
	checks: SeoCheck[]
}

export interface SeoCheck {
	id: string
	label: string
	status: "good" | "warning" | "error"
	message: string
}

export function calculateSeoScore(opts: {
	title: string
	metaDescription: string
	content: string
	slug: string
	hasImage: boolean
}): SeoScore {
	const checks: SeoCheck[] = []

	// Title length (50–60 chars ideal)
	const titleLen = opts.title.length
	if (titleLen >= 50 && titleLen <= 60) {
		checks.push({
			id: "title-length",
			label: "Title length",
			status: "good",
			message: `Title is ${titleLen} chars (ideal: 50–60)`,
		})
	} else if (titleLen >= 30 && titleLen <= 70) {
		checks.push({
			id: "title-length",
			label: "Title length",
			status: "warning",
			message: `Title is ${titleLen} chars (ideal: 50–60)`,
		})
	} else {
		checks.push({
			id: "title-length",
			label: "Title length",
			status: "error",
			message: `Title is ${titleLen} chars (ideal: 50–60)`,
		})
	}

	// Meta description (150–160 chars ideal)
	const descLen = opts.metaDescription.length
	if (descLen >= 120 && descLen <= 160) {
		checks.push({
			id: "meta-desc-length",
			label: "Meta description",
			status: "good",
			message: `Description is ${descLen} chars (ideal: 120–160)`,
		})
	} else if (descLen > 0 && descLen < 120) {
		checks.push({
			id: "meta-desc-length",
			label: "Meta description",
			status: "warning",
			message: `Description is ${descLen} chars — could be longer (ideal: 120–160)`,
		})
	} else if (descLen === 0) {
		checks.push({
			id: "meta-desc-length",
			label: "Meta description",
			status: "error",
			message: "Meta description is missing",
		})
	} else {
		checks.push({
			id: "meta-desc-length",
			label: "Meta description",
			status: "warning",
			message: `Description is ${descLen} chars — too long (ideal: 120–160)`,
		})
	}

	// Content length
	const plainText = stripHtml(opts.content)
	const wordCount = plainText.split(/\s+/).filter(Boolean).length
	if (wordCount >= 300) {
		checks.push({
			id: "content-length",
			label: "Content length",
			status: "good",
			message: `${wordCount} words (minimum: 300)`,
		})
	} else if (wordCount >= 100) {
		checks.push({
			id: "content-length",
			label: "Content length",
			status: "warning",
			message: `${wordCount} words — consider adding more (minimum: 300)`,
		})
	} else {
		checks.push({
			id: "content-length",
			label: "Content length",
			status: "error",
			message: `${wordCount} words — too short (minimum: 300)`,
		})
	}

	// Has headings (h2/h3)
	const headingCount = (opts.content.match(/<h[2-3][^>]*>/gi) || []).length
	if (headingCount >= 2) {
		checks.push({
			id: "headings",
			label: "Headings",
			status: "good",
			message: `${headingCount} subheadings found`,
		})
	} else if (headingCount === 1) {
		checks.push({
			id: "headings",
			label: "Headings",
			status: "warning",
			message: "Only 1 subheading — consider adding more for structure",
		})
	} else {
		checks.push({
			id: "headings",
			label: "Headings",
			status: "error",
			message: "No subheadings — add h2/h3 to structure content",
		})
	}

	// Has image
	if (opts.hasImage) {
		checks.push({
			id: "has-image",
			label: "Featured image",
			status: "good",
			message: "Post has an image",
		})
	} else {
		checks.push({
			id: "has-image",
			label: "Featured image",
			status: "warning",
			message: "No image — consider adding one for engagement",
		})
	}

	// Slug quality
	if (opts.slug && !opts.slug.includes("_") && opts.slug.length <= 75) {
		checks.push({
			id: "slug",
			label: "URL slug",
			status: "good",
			message: "Clean, readable slug",
		})
	} else if (opts.slug.length > 75) {
		checks.push({
			id: "slug",
			label: "URL slug",
			status: "warning",
			message: "Slug is long — consider shortening",
		})
	} else {
		checks.push({
			id: "slug",
			label: "URL slug",
			status: "warning",
			message: "Slug uses underscores — prefer hyphens",
		})
	}

	// Has internal links
	const linkCount = (opts.content.match(/<a[^>]+href=/gi) || []).length
	if (linkCount > 0) {
		checks.push({
			id: "internal-links",
			label: "Links",
			status: "good",
			message: `${linkCount} link(s) found in content`,
		})
	} else {
		checks.push({
			id: "internal-links",
			label: "Links",
			status: "warning",
			message: "No links in content — consider adding internal links",
		})
	}

	// Calculate overall score
	const maxPoints = checks.length * 2
	const points = checks.reduce((sum, c) => {
		if (c.status === "good") return sum + 2
		if (c.status === "warning") return sum + 1
		return sum
	}, 0)
	const score = Math.round((points / maxPoints) * 100)

	return { score, checks }
}

// ─── Internal auto-linking ──────────────────────────────────

export function autoInternalLink(
	html: string,
	keywords: Array<{ keyword: string; url: string }>,
	maxLinksPerKeyword = 1,
): string {
	let result = html

	for (const { keyword, url } of keywords) {
		// Don't link inside existing links, headings, code blocks
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

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// ─── IndexNow ping ──────────────────────────────────────────

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

export async function pingSitemap(): Promise<void> {
	const siteUrl = getSiteUrl()
	const sitemapUrl = `${siteUrl}/api/sitemap`
	try {
		await fetch(
			`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
		)
	} catch {
		// Silently fail — this is best-effort
	}
}

// ─── Crawler detection ──────────────────────────────────────

const CRAWLER_UAS = [
	"Googlebot",
	"Bingbot",
	"Slurp",
	"DuckDuckBot",
	"Baiduspider",
	"YandexBot",
	"facebookexternalhit",
	"Twitterbot",
	"LinkedInBot",
]

export function isCrawler(userAgent: string | null): boolean {
	if (!userAgent) return false
	return CRAWLER_UAS.some((bot) =>
		userAgent.toLowerCase().includes(bot.toLowerCase()),
	)
}
