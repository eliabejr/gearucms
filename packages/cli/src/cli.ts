#!/usr/bin/env node
import updateNotifier from "update-notifier"
import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { createCliProgram } from "./program"

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8"),
) as { name: string; version: string }

updateNotifier({ pkg }).notify()

await createCliProgram(pkg.version).parseAsync()
