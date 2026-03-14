import { resolve } from "node:path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [react(), tsconfigPaths({ projects: ["./tsconfig.json"] })],
	resolve: {
		alias: [
			{ find: "@gearu/core/client", replacement: resolve(__dirname, "packages/core/src/client.ts") },
			{ find: "@gearu/core/trpc", replacement: resolve(__dirname, "packages/core/src/trpc/index.ts") },
			{ find: /^@gearu\/core$/, replacement: resolve(__dirname, "packages/core/src/index.ts") },
			{ find: /^@gearu\/admin$/, replacement: resolve(__dirname, "packages/admin/src/index.tsx") },
		],
	},
	test: {
		globals: true,
		environment: "jsdom",
		include: ["packages/**/*.test.ts", "packages/**/*.test.tsx", "tests/**/*.test.ts"],
		setupFiles: ["./tests/setup.ts"],
		restoreMocks: true,
		clearMocks: true,
		mockReset: true,
	},
})
