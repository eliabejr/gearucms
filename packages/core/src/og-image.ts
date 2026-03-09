/** Escape a string for safe XML embedding. */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** Generate an SVG-based OG image (1200x630). */
export function generateOgImageSvg(
  title: string,
  section?: string,
  brandName = "Gearu",
): string {
  const displayTitle =
    title.length > 80 ? `${title.substring(0, 77)}...` : title

  const words = displayTitle.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length > 30 && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const titleY = 280 - (lines.length - 1) * 30
  const titleSvg = lines
    .map(
      (line, i) =>
        `<text x="80" y="${titleY + i * 64}" fill="#1a1a2e" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join("\n    ")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f4f8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#0891b2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="0" y="0" width="1200" height="8" fill="url(#accent)" />
  <circle cx="1100" cy="100" r="200" fill="#0891b2" opacity="0.05" />
  <circle cx="1050" cy="500" r="150" fill="#06b6d4" opacity="0.05" />
  ${section ? `<text x="80" y="${titleY - 40}" fill="#0891b2" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" letter-spacing="2">${escapeXml(section.toUpperCase())}</text>` : ""}
  ${titleSvg}
  <rect x="0" y="580" width="1200" height="50" fill="#1a1a2e" />
  <text x="80" y="612" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500">${escapeXml(brandName)}</text>
</svg>`
}
