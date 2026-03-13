import { defineConfig } from "tsup"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/client.ts",
    "src/trpc/index.ts",
    "src/auth/client.ts",
    "src/auth/server.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["better-sqlite3"],
})
