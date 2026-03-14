import { getOptionalModuleByPath, OPTIONAL_ADMIN_MODULES } from "../optionalModules"

describe("optional modules", () => {
	it("returns the matching optional module for known paths", () => {
		expect(getOptionalModuleByPath("/leads")).toEqual(OPTIONAL_ADMIN_MODULES[0])
		expect(getOptionalModuleByPath("/analytics")).toEqual(OPTIONAL_ADMIN_MODULES[1])
	})

	it("returns undefined for unknown paths", () => {
		expect(getOptionalModuleByPath("/missing")).toBeUndefined()
	})
})
