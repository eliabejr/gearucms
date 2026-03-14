import {
	autoInternalLink,
	calculateSeoScore,
	extractExcerpt,
	extractFirstImage,
	generateArticleJsonLd,
	generateBreadcrumbJsonLd,
	generateMetaTags,
	generateOrganizationJsonLd,
	getSiteUrl,
	isCrawler,
	pingIndexNow,
	pingSitemap,
	prepareEntryJsonLd,
	prepareEntryMeta,
	stripHtml,
} from "../seo"

describe("seo helpers", () => {
	it("normalizes the site url", () => {
		process.env.SITE_URL = "https://example.com/"
		expect(getSiteUrl()).toBe("https://example.com")
	})

	it("generates meta tags with sensible defaults", () => {
		const meta = generateMetaTags({
			title: "Test page",
			description: "Test description",
			canonical: "https://example.com/test-page",
		})

		expect(meta).toContainEqual({ title: "Test page" })
		expect(meta).toContainEqual({ name: "description", content: "Test description" })
		expect(meta).toContainEqual({ property: "og:type", content: "website" })
		expect(meta).toContainEqual({ name: "twitter:card", content: "summary_large_image" })
	})

	it("generates article, breadcrumb, and organization json-ld payloads", () => {
		expect(
			generateArticleJsonLd({
				title: "Hello",
				description: "World",
				url: "https://example.com/blog/hello",
				publishedAt: "2025-01-01T00:00:00.000Z",
			}),
		).toMatchObject({ "@type": "BlogPosting", headline: "Hello" })

		expect(
			generateBreadcrumbJsonLd([
				{ name: "Home", url: "https://example.com" },
				{ name: "Blog", url: "https://example.com/blog" },
			]),
		).toMatchObject({
			"@type": "BreadcrumbList",
			itemListElement: [{ position: 1 }, { position: 2 }],
		})

		expect(
			generateOrganizationJsonLd({
				name: "Gearu",
				url: "https://example.com",
				logo: "https://example.com/logo.png",
			}),
		).toMatchObject({ "@type": "Organization", logo: "https://example.com/logo.png" })
	})

	it("strips html, extracts excerpts, and finds images", () => {
		const html = `<p>Hello&nbsp;<strong>world</strong> &amp; universe</p><img src="/hero.png" />`

		expect(stripHtml(html)).toBe("Hello world & universe")
		expect(extractExcerpt(`${html} ${"word ".repeat(80)}`, 80)).toMatch(/\.\.\.$/)
		expect(extractFirstImage(html)).toBe("/hero.png")
		expect(extractFirstImage("<p>No image</p>")).toBeNull()
	})

	it("scores content across good, warning, and error branches", () => {
		const good = calculateSeoScore({
			title: "A search-friendly page title with ideal length 52 chars",
			metaDescription: "A concise but complete summary that comfortably sits in the recommended SEO description length range for search snippets.",
			content: `<h2>Heading</h2><p>${"word ".repeat(320)}</p><h3>Subheading</h3><a href="/docs">Docs</a>`,
			slug: "search-friendly-slug",
			hasImage: true,
		})

		const warning = calculateSeoScore({
			title: "A fine enough title",
			metaDescription: "Short description",
			content: `<h2>Heading</h2><p>${"word ".repeat(120)}</p>`,
			slug: "slug_with_underscores",
			hasImage: false,
		})

		const error = calculateSeoScore({
			title: "tiny",
			metaDescription: "",
			content: "<p>tiny body</p>",
			slug: "x",
			hasImage: false,
		})

		expect(good.score).toBeGreaterThan(warning.score)
		expect(warning.score).toBeGreaterThan(error.score)
		expect(good.checks.some((check) => check.status === "good")).toBe(true)
		expect(warning.checks.some((check) => check.status === "warning")).toBe(true)
		expect(error.checks.some((check) => check.status === "error")).toBe(true)
	})

	it("adds internal links without relinking existing anchors", () => {
		const html = "<p>Gearu helps teams scale. <a href=\"/existing\">Gearu</a> is fast.</p>"
		const linked = autoInternalLink(html, [{ keyword: "Gearu", url: "/docs/gearu" }], 1)

		expect(linked).toContain('<a href="/docs/gearu" title="Gearu">Gearu</a>')
		expect(linked.match(/title="Gearu"/g)?.length).toBe(1)
		expect(linked).toContain('<a href="/existing">Gearu</a>')
	})

	it("detects crawlers", () => {
		expect(isCrawler("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true)
		expect(isCrawler("Mozilla/5.0 Safari/537.36")).toBe(false)
		expect(isCrawler(null)).toBe(false)
	})

	it("prepares entry meta and json-ld from entry content", () => {
		const entry = {
			title: "Hello World",
			slug: "hello-world",
			metaTitle: null,
			metaDescription: null,
			ogImage: null,
			publishedAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-02T00:00:00.000Z",
			collection: { name: "Blog", slug: "blog" },
			fields: [
				{
					field: { name: "Content", slug: "content", type: "richtext" },
					value: `<p>${"word ".repeat(40)}</p><img src="/cover.png" />`,
				},
			],
		}

		const meta = prepareEntryMeta(entry, "https://example.com")
		const jsonLd = prepareEntryJsonLd(entry, "https://example.com")

		expect(meta).toContainEqual({ property: "og:type", content: "article" })
		expect(meta).toContainEqual({ tagName: "link", rel: "canonical", href: "https://example.com/blog/hello-world" })
		expect(jsonLd).toMatchObject({
			"@type": "BlogPosting",
			url: "https://example.com/blog/hello-world",
		})
	})

	it("pings index services with the expected payloads", async () => {
		const fetchMock = vi.mocked(fetch)
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({}),
			text: async () => "",
		} as Response)

		await expect(pingIndexNow(["https://example.com/blog/hello-world"])).resolves.toBe(true)
		await expect(pingSitemap()).resolves.toBeUndefined()

		expect(fetchMock).toHaveBeenCalled()
	})
})
