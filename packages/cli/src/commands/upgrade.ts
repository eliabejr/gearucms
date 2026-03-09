import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { cwd } from "process"

export async function upgrade() {
  const root = cwd()
  const pkgPath = join(root, "package.json")
  if (!existsSync(pkgPath)) {
    console.log("No package.json in current directory.")
    return
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const gearuCore = deps["@gearu/core"]
  if (gearuCore) {
    console.log("Current @gearu/core:", gearuCore)
    console.log("Run pnpm update @gearu/core @gearu/admin to upgrade.")
  }
  console.log("Run gearu migrate to apply any new migrations.")
}
