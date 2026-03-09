export interface SitemapEntry {
  slug: string
  collectionSlug?: string | null
  updatedAt?: Date | string | null
}

/** Generate a sitemap XML string from published entries. */
export function generateSitemapXml(
  siteUrl: string,
  entries: SitemapEntry[],
): string {
  const urls = [
    `  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ...entries.map((entry) => {
      const lastmod = entry.updatedAt
        ? new Date(entry.updatedAt as string).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0]
      return `  <url>
    <loc>${siteUrl}/${entry.collectionSlug ?? ""}/${entry.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    }),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`
}
