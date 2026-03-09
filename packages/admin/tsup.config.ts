import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react-dom", "@gearu/core"],
  esbuildOptions(options) {
    options.jsx = "automatic"
  },
})
