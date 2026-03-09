function stripHtml(html: string): string {
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

export interface SeoScore {
	score: number
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
	const points = checks.reduce((sum, c) => (c.status === "good" ? sum + 2 : c.status === "warning" ? sum + 1 : sum), 0)
	const score = Math.round((points / maxPoints) * 100)
	return { score, checks }
}
