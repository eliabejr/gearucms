import { resolve } from "path";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isCloudflare =
	process.env.CF_PAGES === "1" || process.env.DEPLOY_TARGET === "cloudflare";

const stubDrizzle = resolve(process.cwd(), "src/lib/stub-better-sqlite.ts")
const stubBetterSqlite3 = resolve(
	process.cwd(),
	"src/lib/stub-better-sqlite3-pkg.ts",
)

/** Stub Node-only DB modules in the client only; server keeps real modules. */
function stubDbForClient(): import("vite").Plugin {
	return {
		name: "stub-db-for-client",
		enforce: "pre",
		resolveId(id, _importer, opts) {
			if (opts?.ssr) return undefined
			if (id === "better-sqlite3" || id === "drizzle-orm/better-sqlite3") {
				return id === "better-sqlite3" ? stubBetterSqlite3 : stubDrizzle
			}
			return undefined
		},
	}
}

const config = defineConfig((env) => {
	const ssrBuild = (env as { ssrBuild?: boolean }).ssrBuild
	return {
		optimizeDeps: {
			exclude: ["better-sqlite3", "drizzle-orm/better-sqlite3"],
		},
		resolve: {
			alias:
				ssrBuild === false
					? {
							"drizzle-orm/better-sqlite3": stubDrizzle,
							"better-sqlite3": stubBetterSqlite3,
						}
					: undefined,
		},
		plugins: [
			stubDbForClient(),
			devtools(),
			paraglideVitePlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
				strategy: ["url", "baseLocale"],
			}),
			nitro({
				...(isCloudflare
					? {
							preset: "cloudflare-module",
							alias: { "#/db/index": "#/db/index.d1" },
							rollupConfig: {
								external: [/^@sentry\//],
							},
						}
					: {
							rollupConfig: { external: [/^@sentry\//] },
						}),
			}),
			tsconfigPaths({ projects: ["./tsconfig.json"] }),
			tailwindcss(),
			tanstackStart(),
			viteReact(),
		],
	}
});

export default config;
