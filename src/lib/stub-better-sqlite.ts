/**
 * Stub for drizzle-orm/better-sqlite3 driver. Used in client bundle so Node-only
 * code (better-sqlite3, util.promisify) is never executed in the browser.
 * The real db is only loaded on the server via dynamic import.
 */
export function drizzle() {
	throw new Error(
		"[Gearu] Database is server-only. This stub should not be called in the browser.",
	)
}
