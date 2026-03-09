import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { cwd } from "process"
import { execSync } from "child_process"

export async function migrate(opts: { dryRun?: boolean }) {
  const root = cwd()
  const configPath = join(root, "gearu.config.ts")
  if (!existsSync(configPath)) {
    console.error("gearu.config.ts not found. Run gearu init first.")
    process.exit(1)
  }
  // Delegate to drizzle-kit if the project has it
  const pkgPath = join(root, "package.json")
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { scripts?: Record<string, string> }
    if (pkg.scripts?.["db:generate"]) {
      try {
        execSync("pnpm db:generate", { cwd: root, stdio: "inherit" })
        if (!opts.dryRun && pkg.scripts["db:migrate"]) {
          execSync("pnpm db:migrate", { cwd: root, stdio: "inherit" })
        } else if (!opts.dryRun && pkg.scripts["db:push"]) {
          execSync("pnpm db:push", { cwd: root, stdio: "inherit" })
        }
      } catch (e) {
        process.exit(1)
      }
      return
    }
  }
  console.log("No db:generate script found. Add Drizzle to your project and run pnpm db:generate && pnpm db:push")
}
