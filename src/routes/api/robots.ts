import { createFileRoute } from "@tanstack/react-router"
import { getSiteUrl, generateRobotsTxt } from "@gearu/core"

export const Route = createFileRoute("/api/robots")({
	server: {
		handlers: {
			GET: async () => {
				const siteUrl = getSiteUrl()
				const body = generateRobotsTxt(siteUrl)
				return new Response(body, {
					headers: {
						"Content-Type": "text/plain",
						"Cache-Control": "public, max-age=86400, s-maxage=86400",
					},
				})
			},
		},
	},
})
