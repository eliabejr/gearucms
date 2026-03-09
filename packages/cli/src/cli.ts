#!/usr/bin/env node
import { Command } from "commander"
import updateNotifier from "update-notifier"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
) as { name: string; version: string }

updateNotifier({ pkg }).notify()

const program = new Command()
program.name("gearu").description("Gearu CMS CLI").version(pkg.version)

program
  .command("init")
  .description("Create gearu.config.ts and ensure admin route exists")
  .action(async () => {
    const { init } = await import("./commands/init.js")
    await init()
  })

program
  .command("migrate")
  .description("Generate and apply migrations (core + plugins)")
  .option("--dry-run", "Only generate, do not apply")
  .action(async (opts: { dryRun?: boolean }) => {
    const { migrate } = await import("./commands/migrate.js")
    await migrate(opts)
  })

program
  .command("upgrade")
  .description("Check for updates and optionally run migrations")
  .action(async () => {
    const { upgrade } = await import("./commands/upgrade.js")
    await upgrade()
  })

program.parse()
