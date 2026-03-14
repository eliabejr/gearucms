import { getCoreNavItems } from "../core-nav"

describe("getCoreNavItems", () => {
	it("returns the expected primary admin destinations", () => {
		const items = getCoreNavItems()

		expect(items.map((item) => item.label)).toEqual([
			"Dashboard",
			"Collections",
			"Entries",
			"Media",
			"Comments",
			"Leads",
			"Analytics",
			"Settings",
			"AI Writer",
		])
		expect(items[0]).toMatchObject({ path: "/", exact: true })
		expect(items.every((item) => item.icon)).toBe(true)
	})
})
