import { resolveConfig } from "../config"

describe("resolveConfig", () => {
	it("returns the default config when no input is provided", () => {
		expect(resolveConfig()).toEqual({
			database: "file:./dev.db",
			plugins: [],
			databaseUrl: "file:./dev.db",
		})
	})

	it("resolves a string database value directly", () => {
		expect(resolveConfig({ database: "custom.db" }).databaseUrl).toBe("custom.db")
	})

	it("extracts the url from an object database config", () => {
		expect(resolveConfig({ database: { url: "file:test.db" } }).databaseUrl).toBe("file:test.db")
	})

	it("falls back to DATABASE_URL when the database object has no url", () => {
		process.env.DATABASE_URL = "file:env.db"

		expect(resolveConfig({ database: {} }).databaseUrl).toBe("file:env.db")
	})
})
