import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/trpc/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["better-sqlite3"],
})
