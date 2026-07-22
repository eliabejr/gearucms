import { defineConfig } from "tsup"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/client.ts",
    "src/trpc/index.ts",
    "src/auth/client.ts",
    "src/auth/server.ts",
    "src/db-libsql.ts",
    "src/schema-entry.ts",
    "src/seo-entry.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@libsql/client", "better-sqlite3"],
})
