import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
  },
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  shims: true,
})
