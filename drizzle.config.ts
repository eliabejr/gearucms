import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: ['.env.local', '.env'] })

/**
 * Drizzle Kit configuration
 *
 * Local development:
 *   Uses SQLite dialect with a local .db file
 *   Run: pnpm db:generate && pnpm db:push
 *
 * Cloudflare D1 (production):
 *   Generate migrations, then apply via wrangler:
 *   Run: pnpm db:generate
 *   Apply: npx wrangler d1 migrations apply eli-cms-db --local  (local D1)
 *   Apply: npx wrangler d1 migrations apply eli-cms-db --remote (production D1)
 */
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
