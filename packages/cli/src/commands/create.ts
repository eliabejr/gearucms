import { mkdirSync, existsSync } from "fs"
import { join } from "path"
import { cwd } from "process"

export async function create(directory: string) {
  const target = join(cwd(), directory)
  if (existsSync(target)) {
    console.log(`Directory ${directory} already exists.`)
    return
  }
  mkdirSync(target, { recursive: true })
  console.log(`Created ${directory}.`)
  console.log("Next: cd", directory, "&& pnpm add @gearu/core @gearu/admin && gearu init")
}
