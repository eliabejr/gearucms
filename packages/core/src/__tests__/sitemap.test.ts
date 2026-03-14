import { generateSitemapXml } from "../sitemap"

describe("generateSitemapXml", () => {
	it("renders the root url when no entries are provided", () => {
		const xml = generateSitemapXml("https://example.com", [])

		expect(xml).toContain("<loc>https://example.com/</loc>")
		expect(xml).toContain("<urlset")
	})

	it("renders collection entries with lastmod values", () => {
		const xml = generateSitemapXml("https://example.com", [
			{ collectionSlug: "blog", slug: "hello-world", updatedAt: "2025-01-05T00:00:00.000Z" },
			{ collectionSlug: "docs", slug: "getting-started" },
		])

		expect(xml).toContain("<loc>https://example.com/blog/hello-world</loc>")
		expect(xml).toContain("<lastmod>2025-01-05</lastmod>")
		expect(xml).toContain("<loc>https://example.com/docs/getting-started</loc>")
	})
})
