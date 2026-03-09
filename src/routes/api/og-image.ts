import { createFileRoute } from "@tanstack/react-router"
import { generateOgImageSvg } from "@gearu/core"

export const Route = createFileRoute("/api/og-image")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url)
				const title = url.searchParams.get("title") || "Untitled"
				const section = url.searchParams.get("section") || undefined
				const svg = generateOgImageSvg(title, section, "Gearu")

				return new Response(svg, {
					headers: {
						"Content-Type": "image/svg+xml",
						"Cache-Control": "public, max-age=604800, s-maxage=604800",
					},
				})
			},
		},
	},
})
