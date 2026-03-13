import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/trpc/index.ts", "src/auth/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["better-sqlite3"],
})
