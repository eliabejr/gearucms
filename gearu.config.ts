import type { GearuConfig } from "@gearu/core"

const config: GearuConfig = {
	database: process.env.DATABASE_URL ?? "file:./dev.db",
	plugins: ["@gearu/plugin-leads", "@gearu/plugin-analytics"],
}

export default config
