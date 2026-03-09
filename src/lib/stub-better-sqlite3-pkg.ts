/**
 * Stub for the "better-sqlite3" package. Used in client bundle so the native
 * Node module is never loaded in the browser. The real package is only used on the server.
 * Export a default so `import Database from 'better-sqlite3'` gets this and fails at runtime if used.
 */
function stub() {
	throw new Error(
		"[Gearu] better-sqlite3 is server-only. This stub should not be called in the browser.",
	)
}

export default stub
