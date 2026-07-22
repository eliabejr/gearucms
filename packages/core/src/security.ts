export const GEARU_ROLES = ["owner", "editor", "author", "member"] as const
export type GearuRole = (typeof GEARU_ROLES)[number]
export type GearuEditorialRole = Exclude<GearuRole, "member">

export function isEditorialRole(role: unknown): role is GearuEditorialRole {
	return role === "owner" || role === "editor" || role === "author"
}

/** Unicode-aware URL slug generation for international publications. */
export function slugify(value: string): string {
	return value
		.normalize("NFKD")
		.replace(/\p{M}+/gu, "")
		.toLocaleLowerCase()
		.trim()
		.replace(/[^\p{Letter}\p{Number}\s_-]/gu, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
}

/** Escape comment text. Comments are stored as plain text, never executable HTML. */
export function sanitizeComment(value: string): string {
	return value
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
		.trim()
}

/** Create a non-reversible rate-limit identifier with Web Crypto. */
export async function hashRateLimitKey(value: string, salt: string): Promise<string> {
	const bytes = new TextEncoder().encode(`${salt}:${value}`)
	const digest = await crypto.subtle.digest("SHA-256", bytes)
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

const PRIVATE_SETTING_PATTERN =
	/(secret|password|private|token|api[_-]?key|webhook|stripe|resend|smtp|database|libsql|turso|s3|r2|access[_-]?key|auth)/i

/** Conservative default filter for the legacy public settings endpoint. */
export function isPublicSettingKey(key: string): boolean {
	return !PRIVATE_SETTING_PATTERN.test(key)
}
