import { existsSync, readFileSync } from "node:fs"
import { isAbsolute, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { cwd } from "node:process"
import ts from "typescript"
import { createDb, resolveConfig, type GearuConfig, type ResolvedGearuConfig } from "@gearu/core"
import {
  createGearuRouterRecord,
  createGearuTRPC,
} from "@gearu/core/trpc"

const CONFIG_CANDIDATES = [
  "gearu.config.ts",
  "gearu.config.mts",
  "gearu.config.cts",
  "gearu.config.js",
  "gearu.config.mjs",
  "gearu.config.cjs",
] as const

const trpc = createGearuTRPC<{
  headers: Headers
  session: { user: { id: string; name: string } } | null
}>()

const appRouter = trpc.createTRPCRouter(
  createGearuRouterRecord({
    db: null as never,
    publicProcedure: trpc.publicProcedure,
    protectedProcedure: trpc.protectedProcedure,
    TRPCError: trpc.TRPCError,
  }),
)

export type GearuCliCaller = ReturnType<typeof appRouter.createCaller>

export interface GearuCliRuntime {
  caller: GearuCliCaller
  close: () => void
  config: ResolvedGearuConfig
  configPath: string
  databasePath: string
  root: string
}

function getConfigPath(root: string): string {
  for (const name of CONFIG_CANDIDATES) {
    const filePath = join(root, name)
    if (existsSync(filePath)) {
      return filePath
    }
  }

  throw new Error("No gearu config found. Expected gearu.config.ts (or .js/.mjs/.cjs) in the current directory.")
}

function isTypeScriptConfig(configPath: string): boolean {
  return /\.(cts|mts|ts)$/.test(configPath)
}

async function importConfigModule(configPath: string): Promise<{ default?: unknown }> {
  if (!isTypeScriptConfig(configPath)) {
    return import(pathToFileURL(configPath).href)
  }

  const source = readFileSync(configPath, "utf-8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: configPath,
  }).outputText

  const url = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
  return import(url)
}

export async function loadGearuConfig(root = cwd()): Promise<{
  config: ResolvedGearuConfig
  configPath: string
}> {
  const configPath = getConfigPath(root)
  const moduleExports = await importConfigModule(configPath)
  const rawConfig = (moduleExports.default ?? moduleExports) as Partial<GearuConfig> | undefined

  if (!rawConfig || typeof rawConfig !== "object") {
    throw new Error("gearu.config.ts must export a default config object.")
  }

  return {
    config: resolveConfig(rawConfig),
    configPath,
  }
}

function toDatabasePath(databaseUrl: string, root: string): string {
  if (databaseUrl === ":memory:" || databaseUrl === "file::memory:") {
    return ":memory:"
  }

  if (/^(https?|libsql|postgres|mysql):/i.test(databaseUrl)) {
    throw new Error("The Gearu CLI CRUD commands currently support local SQLite databases only.")
  }

  if (databaseUrl.startsWith("file://")) {
    return new URL(databaseUrl).pathname
  }

  const normalized = databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl

  const [pathWithoutQuery] = normalized.split("?")
  if (!pathWithoutQuery) {
    throw new Error("The configured database URL is empty.")
  }

  if (pathWithoutQuery === ":memory:") {
    return ":memory:"
  }

  return isAbsolute(pathWithoutQuery)
    ? pathWithoutQuery
    : resolve(root, pathWithoutQuery)
}

export async function createGearuCliRuntime(root = cwd()): Promise<GearuCliRuntime> {
  const { config, configPath } = await loadGearuConfig(root)
  const databasePath = toDatabasePath(config.databaseUrl, root)
  const betterSqlite3 = (await import("better-sqlite3")) as {
    default: new (path: string) => {
      close: () => void
      pragma: (statement: string) => void
    }
  }
  const connection = new betterSqlite3.default(databasePath)
  connection.pragma("foreign_keys = ON")

  const db = createDb(connection as never)
  const router = trpc.createTRPCRouter(
    createGearuRouterRecord({
      db,
      publicProcedure: trpc.publicProcedure,
      protectedProcedure: trpc.protectedProcedure,
      TRPCError: trpc.TRPCError,
    }),
  )

  return {
    caller: router.createCaller({
      headers: new Headers(),
      session: { user: { id: "cli", name: "Gearu CLI" } },
    }),
    close: () => connection.close(),
    config,
    configPath,
    databasePath,
    root,
  }
}
