export interface RobotsTxtOptions {
  /** Additional paths to disallow. */
  disallow?: string[]
  /** Additional paths to allow. */
  allow?: string[]
  /** Extra directives appended as-is. */
  extra?: string[]
}

/** Generate a robots.txt string. */
export function generateRobotsTxt(
  siteUrl: string,
  options: RobotsTxtOptions = {},
): string {
  const disallowed = ["/admin/", "/api/", "/login", ...(options.disallow ?? [])]
  const allowed = ["/", ...(options.allow ?? [])]

  const lines = [
    "User-agent: *",
    ...allowed.map((p) => `Allow: ${p}`),
    ...disallowed.map((p) => `Disallow: ${p}`),
    "",
    `Sitemap: ${siteUrl}/api/sitemap`,
    ...(options.extra ?? []),
  ]

  return lines.join("\n") + "\n"
}
