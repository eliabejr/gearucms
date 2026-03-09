import { createFileRoute } from "@tanstack/react-router"
import { db } from "#/db/index"
import { entries, collections } from "#/db/schema"
import { eq } from "drizzle-orm"
import { getSiteUrl, generateSitemapXml } from "@gearu/core"

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

				const xml = generateSitemapXml(siteUrl, publishedEntries)
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
