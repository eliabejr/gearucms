import { createFileRoute } from "@tanstack/react-router"
import { db } from "#/db/index"
import { entries, collections } from "#/db/schema"
import { eq } from "drizzle-orm"
import { getSiteUrl } from "#/lib/seo"

export const Route = createFileRoute("/api/sitemap")({
	server: {
		handlers: {
			GET: async () => {
				const siteUrl = getSiteUrl()

				const publishedEntries = await db
					.select({
						slug: entries.slug,
						updatedAt: entries.updatedAt,
						collectionSlug: collections.slug,
					})
					.from(entries)
					.leftJoin(collections, eq(entries.collectionId, collections.id))
					.where(eq(entries.status, "published"))

				const urls = [
					// Homepage
					`  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
					// Published entries
					...publishedEntries.map((entry) => {
						const lastmod = entry.updatedAt
							? new Date(entry.updatedAt).toISOString().split("T")[0]
							: new Date().toISOString().split("T")[0]
						return `  <url>
    <loc>${siteUrl}/${entry.collectionSlug}/${entry.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
					}),
				]

				const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`

				return new Response(xml, {
					headers: {
						"Content-Type": "application/xml",
						"Cache-Control": "public, max-age=3600, s-maxage=3600",
					},
				})
			},
		},
	},
})
