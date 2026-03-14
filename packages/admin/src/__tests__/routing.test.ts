import { normalizePath, matchRoute } from "../gearu-admin"

function Screen() {
	return null
}

describe("admin routing helpers", () => {
	it("normalizes paths relative to the base path", () => {
		expect(normalizePath("/admin", "/admin")).toBe("/")
		expect(normalizePath("/admin/", "/admin/collections/")).toBe("/collections")
		expect(normalizePath("/admin", "/something-else")).toBe("/")
	})

	it("matches exact and parameterized routes", () => {
		const routes = [
			{ path: "/", Component: Screen },
			{ path: "/entries/:id", Component: Screen },
			{ path: "/entries/:id/preview", Component: Screen },
		]

		expect(matchRoute("/", routes)).toEqual({ Component: Screen })
		expect(matchRoute("/entries/42", routes)).toEqual({
			Component: Screen,
			params: { id: "42" },
		})
		expect(matchRoute("/entries/42/preview", routes)).toEqual({
			Component: Screen,
			params: { id: "42" },
		})
		expect(matchRoute("/collections/1", routes)).toBeNull()
	})
})
