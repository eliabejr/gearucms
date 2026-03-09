#!/usr/bin/env node
import { Command } from "commander"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
) as { version: string }

const program = new Command()
program
  .name("create-gearu")
  .description("Scaffold a new project with Gearu CMS")
  .version(pkg.version)
  .argument("[directory]", "Project directory", ".")
  .action(async (directory: string) => {
    const { create } = await import("./commands/create.js")
    await create(directory)
  })

program.parse()
