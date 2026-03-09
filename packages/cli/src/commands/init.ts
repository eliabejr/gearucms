import { writeFileSync, existsSync } from "fs"
import { join } from "path"
import { cwd } from "process"

const GEARU_CONFIG = `import type { GearuConfig } from "@gearu/core"

const config: GearuConfig = {
  database: process.env.DATABASE_URL ?? "file:./dev.db",
  plugins: [
    "@gearu/plugin-leads",
    "@gearu/plugin-analytics",
  ],
}

export default config
`

export async function init() {
  const root = cwd()
  const configPath = join(root, "gearu.config.ts")
  if (!existsSync(configPath)) {
    writeFileSync(configPath, GEARU_CONFIG, "utf-8")
    console.log("Created gearu.config.ts")
  } else {
    console.log("gearu.config.ts already exists")
  }
  console.log("Ensure your app has a route src/routes/admin/$.tsx that renders @gearu/admin.")
  console.log("Run gearu migrate to apply migrations.")
}
