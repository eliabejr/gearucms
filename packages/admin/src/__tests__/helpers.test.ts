import { formatFileSize } from "../screens/media"
import { slugify } from "../screens/entries-new"

describe("admin helper functions", () => {
	it("formats bytes into readable file sizes", () => {
		expect(formatFileSize(512)).toBe("512 B")
		expect(formatFileSize(2048)).toBe("2.0 KB")
		expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB")
		expect(formatFileSize(3 * 1024 * 1024 * 1024)).toBe("3.0 GB")
	})

	it("slugifies titles for entries", () => {
		expect(slugify(" Hello, World! ")).toBe("hello-world")
		expect(slugify("Already__slugified Text")).toBe("already-slugified-text")
	})
})
