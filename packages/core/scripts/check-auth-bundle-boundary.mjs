#!/usr/bin/env node
/**
 * Ensures client-safe auth and client entrypoints do not contain server-only
 * code. Run after `pnpm run build` in packages/core.
 *
 * Forbids in client artifacts: better-sqlite3, better-auth/adapters/drizzle,
 * @tanstack/react-start/server
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const dist = join(root, "dist")

const FORBIDDEN = [
  "better-sqlite3",
  "better-auth/adapters/drizzle",
  "@tanstack/react-start/server",
]

const CLIENT_ARTIFACTS = [
  "auth/client.js",
  "client.js",
]

function checkFile(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing: ${label} (${path})`)
    return false
  }
  const content = readFileSync(path, "utf8")
  for (const sub of FORBIDDEN) {
    if (content.includes(sub)) {
      console.error(`Forbidden "${sub}" found in ${label}`)
      return false
    }
  }
  return true
}

function main() {
  let ok = true

  if (!existsSync(join(dist, "auth/client.js"))) {
    console.error("Run 'pnpm run build' in packages/core first.")
    process.exit(1)
  }

  for (const rel of CLIENT_ARTIFACTS) {
    const path = join(dist, rel)
    if (!checkFile(path, rel)) ok = false
  }

  // Sanity: server entry must contain server-only code
  const serverPath = join(dist, "auth/server.js")
  if (existsSync(serverPath)) {
    const content = readFileSync(serverPath, "utf8")
    if (!content.includes("better-auth") || !content.includes("getRequestHeaders")) {
      console.error("auth/server.js should contain better-auth and getRequestHeaders")
      ok = false
    }
  } else {
    console.error("Missing dist/auth/server.js")
    ok = false
  }

  if (!ok) process.exit(1)
  console.log("Auth bundle boundary check passed.")
}

main()
