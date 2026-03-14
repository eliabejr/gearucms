import { afterEach, beforeEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"

const defaultFetchResponse = {
	ok: true,
	status: 200,
	json: async () => ({}),
	text: async () => "",
}

beforeEach(() => {
	process.env.SITE_URL = "https://example.com"
	process.env.INDEXNOW_API_KEY = "index-now-key"
	process.env.UNSPLASH_ACCESS_KEY = "unsplash-key"
	process.env.PEXELS_API_KEY = "pexels-key"

	vi.stubGlobal("fetch", vi.fn(async () => defaultFetchResponse))
	vi.stubGlobal("confirm", vi.fn(() => true))

	Object.defineProperty(window.navigator, "clipboard", {
		configurable: true,
		value: {
			writeText: vi.fn(async () => undefined),
		},
	})
})

afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
	vi.clearAllMocks()
	delete process.env.SITE_URL
	delete process.env.INDEXNOW_API_KEY
	delete process.env.UNSPLASH_ACCESS_KEY
	delete process.env.PEXELS_API_KEY
})
