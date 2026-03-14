import { escapeXml, generateOgImageSvg } from "../og-image"

describe("og image helpers", () => {
	it("escapes xml entities", () => {
		expect(escapeXml(`<tag attr="value">'&'</tag>`)).toBe(
			"&lt;tag attr=&quot;value&quot;&gt;&apos;&amp;&apos;&lt;/tag&gt;",
		)
	})

	it("generates an svg with wrapped text, section, and brand", () => {
		const svg = generateOgImageSvg(
			"An intentionally long title that should wrap across multiple text lines in the svg output",
			"Guides",
			"Gearu CMS",
		)

		expect(svg).toContain("<svg")
		expect(svg).toContain("GUIDES")
		expect(svg).toContain("Gearu CMS")
		expect(svg).toContain("...")
		expect(svg.match(/<text /g)?.length ?? 0).toBeGreaterThan(2)
	})
})
