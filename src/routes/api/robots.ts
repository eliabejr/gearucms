import { createFileRoute } from "@tanstack/react-router"
import { getSiteUrl } from "#/lib/seo"

export const Route = createFileRoute("/api/robots")({
	server: {
		handlers: {
			GET: async () => {
				const siteUrl = getSiteUrl()

				const robotsTxt = `User-agent: *
Allow: /

# Admin and API
Disallow: /admin/
Disallow: /api/
Disallow: /login

# Sitemap
Sitemap: ${siteUrl}/api/sitemap
`

				return new Response(robotsTxt, {
					headers: {
						"Content-Type": "text/plain",
						"Cache-Control": "public, max-age=86400, s-maxage=86400",
					},
				})
			},
		},
	},
})
