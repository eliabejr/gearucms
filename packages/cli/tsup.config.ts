import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    create: "src/create.ts",
  },
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  shims: true,
})
