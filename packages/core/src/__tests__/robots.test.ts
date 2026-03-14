import { generateRobotsTxt } from "../robots"

describe("generateRobotsTxt", () => {
	it("includes the default allow, disallow, and sitemap directives", () => {
		const robots = generateRobotsTxt("https://example.com")

		expect(robots).toContain("User-agent: *")
		expect(robots).toContain("Allow: /")
		expect(robots).toContain("Disallow: /admin/")
		expect(robots).toContain("Disallow: /api/")
		expect(robots).toContain("Disallow: /login")
		expect(robots).toContain("Sitemap: https://example.com/api/sitemap")
		expect(robots.endsWith("\n")).toBe(true)
	})

	it("appends custom directives", () => {
		const robots = generateRobotsTxt("https://example.com", {
			allow: ["/public"],
			disallow: ["/drafts"],
			extra: ["Host: example.com"],
		})

		expect(robots).toContain("Allow: /public")
		expect(robots).toContain("Disallow: /drafts")
		expect(robots).toContain("Host: example.com")
	})
})
