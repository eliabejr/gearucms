/**
 * Server-side tRPC setup using better-sqlite3 + Gearu core.
 * This file runs in Vite's SSR context via the dev server plugin.
 */
import Database from "better-sqlite3"
import { createDb } from "@gearu/core"
import { createGearuTRPC, createGearuRouterRecord } from "@gearu/core/trpc"
import analyticsPlugin from "@gearu/plugin-analytics"
import { createAnalyticsRouter } from "@gearu/plugin-analytics"
import leadsPlugin from "@gearu/plugin-leads"
import { createLeadsRouter } from "@gearu/plugin-leads"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"

const plugins = [analyticsPlugin, leadsPlugin]

const sqlite = new Database("demo.db")
sqlite.pragma("journal_mode = WAL")

const db = createDb(sqlite, { plugins })

// Auto-create tables
const tableStatements = [
  `CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, email_verified INTEGER NOT NULL DEFAULT 0, image TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS session (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()), ip_address TEXT, user_agent TEXT, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS account (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, provider_id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, access_token TEXT, refresh_token TEXT, id_token TEXT, access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, password TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS verification (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS collections (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS collection_fields (id INTEGER PRIMARY KEY AUTOINCREMENT, collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE, name TEXT NOT NULL, slug TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'text', required INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE, title TEXT NOT NULL, slug TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', meta_title TEXT, meta_description TEXT, og_image TEXT, published_at INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS entry_fields (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE, field_id INTEGER NOT NULL REFERENCES collection_fields(id) ON DELETE CASCADE, value TEXT)`,
  `CREATE TABLE IF NOT EXISTS entry_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE, version_number INTEGER NOT NULL DEFAULT 1, data_snapshot TEXT NOT NULL DEFAULT '[]', created_by TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS media (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL, url TEXT NOT NULL, mime_type TEXT NOT NULL DEFAULT 'application/octet-stream', size INTEGER NOT NULL DEFAULT 0, alt TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE, author_name TEXT NOT NULL, author_email TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS tracking_scripts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, location TEXT NOT NULL DEFAULT 'head', script TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS ai_jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, csv_data TEXT NOT NULL DEFAULT '[]', collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE, image_mode TEXT NOT NULL DEFAULT 'none', status TEXT NOT NULL DEFAULT 'pending', completed_at INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS ai_job_items (id INTEGER PRIMARY KEY AUTOINCREMENT, job_id INTEGER NOT NULL REFERENCES ai_jobs(id) ON DELETE CASCADE, title TEXT NOT NULL, schedule_days INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', generated_text TEXT, generated_image_url TEXT, entry_id INTEGER, error TEXT, tokens_used INTEGER DEFAULT 0, image_tokens_used INTEGER DEFAULT 0, completed_at INTEGER, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS ai_usage_log (id INTEGER PRIMARY KEY AUTOINCREMENT, job_id INTEGER, job_item_id INTEGER, provider TEXT NOT NULL, model TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'text', tokens_input INTEGER NOT NULL DEFAULT 0, tokens_output INTEGER NOT NULL DEFAULT 0, cost_estimate TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  // Analytics plugin
  `CREATE TABLE IF NOT EXISTS page_views (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL, referrer TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_term TEXT, utm_content TEXT, user_agent TEXT, country TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  // Leads plugin
  `CREATE TABLE IF NOT EXISTS lead_forms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, fields TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
  `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, form_id INTEGER NOT NULL REFERENCES lead_forms(id) ON DELETE CASCADE, data TEXT NOT NULL DEFAULT '{}', utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_term TEXT, utm_content TEXT, referrer TEXT, user_agent TEXT, ip_address TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))`,
]

for (const stmt of tableStatements) {
  sqlite.exec(stmt)
}

// Seed a demo user if none exists
const userCount = sqlite.prepare("SELECT COUNT(*) as count FROM user").get() as { count: number }
if (userCount.count === 0) {
  const id = crypto.randomUUID()
  sqlite.prepare("INSERT INTO user (id, name, email) VALUES (?, ?, ?)").run(id, "Demo User", "demo@gearu.dev")
}

// Create tRPC router
const { createTRPCRouter, publicProcedure, protectedProcedure, TRPCError } = createGearuTRPC()

const routerCtx = { db, publicProcedure, protectedProcedure, TRPCError } as any
const coreRecord = createGearuRouterRecord(routerCtx)
const analyticsRecord = createAnalyticsRouter(routerCtx)
const leadsRecord = createLeadsRouter(routerCtx)

export const appRouter = createTRPCRouter({
  ...coreRecord,
  ...analyticsRecord,
  ...leadsRecord,
} as any)

export type AppRouter = typeof appRouter

// Fake session for demo (always authenticated)
const demoSession = {
  user: {
    id: "demo",
    name: "Demo User",
    email: "demo@gearu.dev",
  },
}

export function handleTRPC(request: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => ({
      headers: new Headers(request.headers),
      session: demoSession,
    }),
  })
}
