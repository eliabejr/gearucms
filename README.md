# Gearu

Open-source headless CMS that installs inside your React project. Type-safe from database to UI.

Built on Drizzle ORM, tRPC, and Better Auth. Works with TanStack Start, Next.js, Remix, or any React setup.

## Packages

| Package | Description |
|---------|-------------|
| `@gearu/core` | Schema, database, tRPC routers, auth, SEO utilities |
| `@gearu/admin` | Admin panel UI and components |
| `@gearu/cli` | CLI for scaffolding, migrations, and content management |
| `@gearu/plugin-analytics` | Page view tracking, traffic sources, UTM campaigns |
| `@gearu/plugin-leads` | Dynamic form builder, lead capture with UTM attribution |

---

## Quick Start

### 1. Install

```bash
# Core packages
pnpm add @gearu/core @gearu/admin drizzle-kit better-sqlite3

# CLI (optional)
pnpm add -D @gearu/cli

# Plugins (optional)
pnpm add @gearu/plugin-analytics @gearu/plugin-leads
```

### 2. Create config

```ts
// gearu.config.ts
export default {
  database: "file:./dev.db",
  plugins: ["@gearu/plugin-leads", "@gearu/plugin-analytics"],
}
```

### 3. Set up the database

```ts
// src/db/index.ts
import Database from "better-sqlite3"
import { createDb } from "@gearu/core"
import analyticsPlugin from "@gearu/plugin-analytics"
import leadsPlugin from "@gearu/plugin-leads"

const sqlite = new Database("./dev.db")
sqlite.pragma("journal_mode = WAL")

export const db = createDb(sqlite, {
  plugins: [analyticsPlugin, leadsPlugin],
})
```

Add the Gearu schema to your Drizzle config for migrations:

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: [
    "./node_modules/@gearu/core/dist/index.js",
    // Plugin schemas are merged automatically by createDb
  ],
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: "./dev.db" },
})
```

```bash
pnpm drizzle-kit push
```

### 4. Set up tRPC

#### Server

```ts
// src/trpc/router.ts
import { createGearuTRPC, createGearuRouterRecord } from "@gearu/core/trpc"
import { createAnalyticsRouter } from "@gearu/plugin-analytics"
import { createLeadsRouter } from "@gearu/plugin-leads"
import { db } from "../db"

const { createTRPCRouter, publicProcedure, protectedProcedure, TRPCError } =
  createGearuTRPC()

const ctx = { db, publicProcedure, protectedProcedure, TRPCError }

export const appRouter = createTRPCRouter({
  ...createGearuRouterRecord(ctx),
  ...createAnalyticsRouter(ctx),
  ...createLeadsRouter(ctx),
})

export type AppRouter = typeof appRouter
```

#### Client

```ts
// src/trpc/client.ts
import { createTRPCContext } from "@trpc/tanstack-react-query"
import type { AppRouter } from "./router"

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()
```

### 5. Set up auth

Auth is split into **server-only** and **client-safe** entrypoints so your bundler never pulls server code into the browser.

```ts
// src/lib/auth.ts (server only)
import { createGearuAuth } from "@gearu/core/auth/server"
import { db } from "../db"

export const auth = createGearuAuth(db, {
  secret: process.env.BETTER_AUTH_SECRET,
})
```

```ts
// src/lib/auth-client.ts (client safe)
import { createGearuAuthClient } from "@gearu/core/auth/client"

export const authClient = createGearuAuthClient()
```

```ts
// src/lib/auth.server.ts (server only)
import { createGearuAuthServerHelpers } from "@gearu/core/auth/server"
import { auth } from "./auth"

export const { getSession, ensureSession } = createGearuAuthServerHelpers(auth)
```

### 6. Mount the admin panel

```tsx
// src/routes/admin/$.tsx
import { GearuAdmin } from "@gearu/admin"
import "@gearu/admin/styles.css"
import { useTRPC } from "../trpc/client"
import analyticsPlugin from "@gearu/plugin-analytics"
import leadsPlugin from "@gearu/plugin-leads"

function AdminPage() {
  return (
    <GearuAdmin
      pathname={location.pathname}
      basePath="/admin"
      plugins={[analyticsPlugin, leadsPlugin]}
      Link={Link}
      useTRPC={useTRPC}
      session={session}
      onSignOut={() => { /* sign out logic */ }}
      navigate={(path) => navigate(path)}
      brandName="My Site"
    />
  )
}
```

### 7. Environment variables

```env
DATABASE_URL=file:./dev.db
BETTER_AUTH_SECRET=your-secret-here
SITE_URL=http://localhost:3000
```

---

## API Reference

### `@gearu/core`

#### Database

| Export | Description |
|--------|-------------|
| `createDb(connection, options?)` | Creates a Drizzle ORM instance with core + plugin schemas merged |
| `CoreSchema` | TypeScript type for the core database schema |
| `CreateDbOptions` | Options for `createDb` (includes `plugins` array) |

#### Config

| Export | Description |
|--------|-------------|
| `resolveConfig(config)` | Resolves and validates a Gearu config object |
| `GearuConfig` | Config type for `gearu.config.ts` |

#### Plugin System

| Export | Description |
|--------|-------------|
| `definePlugin(config)` | Creates a plugin with schema, admin routes, and tRPC routers |
| `GearuPlugin` | Plugin type with `id`, `name`, `version`, `schema`, `admin`, `trpcRouter` |

#### SEO Utilities

| Export | Description |
|--------|-------------|
| `generateMetaTags(options)` | Returns meta tag objects for a page |
| `generateArticleJsonLd(article)` | Generates Article JSON-LD structured data |
| `generateBreadcrumbJsonLd(items)` | Generates BreadcrumbList JSON-LD |
| `generateOrganizationJsonLd(org)` | Generates Organization JSON-LD |
| `calculateSeoScore(entry)` | Returns a 0-100 SEO score with actionable checks |
| `prepareEntryMeta(entry, site)` | Builds complete meta tags for a CMS entry |
| `prepareEntryJsonLd(entry, site)` | Builds JSON-LD for a CMS entry |
| `getSiteUrl()` | Reads `SITE_URL` from environment |
| `stripHtml(html)` | Removes HTML tags from a string |
| `extractExcerpt(html, length?)` | Extracts a plain-text excerpt from HTML content |
| `extractFirstImage(html)` | Finds the first `<img>` src in HTML |
| `autoInternalLink(text, links)` | Auto-links keywords to internal URLs |
| `isCrawler(userAgent)` | Detects search engine bots |
| `pingIndexNow(url, key)` | Submits a URL to IndexNow |
| `pingSitemap(sitemapUrl)` | Pings search engines with your sitemap URL |

#### Generators

| Export | Description |
|--------|-------------|
| `generateRobotsTxt(siteUrl, options?)` | Generates a robots.txt file |
| `generateSitemapXml(entries)` | Generates a sitemap.xml file |
| `generateOgImageSvg(title, site?)` | Generates an SVG OG image |

### `@gearu/core/trpc`

| Export | Description |
|--------|-------------|
| `createGearuTRPC()` | Creates tRPC primitives: `createTRPCRouter`, `publicProcedure`, `protectedProcedure`, `TRPCError` |
| `createGearuRouterRecord(ctx)` | Returns the full core tRPC router record (collections, entries, media, comments, settings, ai, gearu meta) |
| `createCollectionsRouter(ctx)` | Collections CRUD router |
| `createEntriesRouter(ctx)` | Entries CRUD with versioning |
| `createMediaRouter(ctx)` | Media management router |
| `createCommentsRouter(ctx)` | Comments with moderation |
| `createSettingsRouter(ctx)` | Site settings router |
| `createAiRouter(ctx)` | AI writer job management |
| `createGearuMetaRouter(ctx)` | Dashboard stats and meta |
| `getUserFacingErrorMessage(error)` | Converts tRPC errors to user-friendly messages |
| `GearuTRPCContext` | Context type with `headers` and `session` |
| `CreateGearuRouterContext` | Context type for router factory functions |

### `@gearu/core/auth/server`

| Export | Description |
|--------|-------------|
| `createGearuAuth(db, options)` | Creates a Better Auth instance with email/password provider |
| `createGearuAuthServerHelpers(auth)` | Returns `getSession()` and `ensureSession()` helpers |

### `@gearu/core/auth/client`

| Export | Description |
|--------|-------------|
| `createGearuAuthClient(options?)` | Creates a client-safe auth client for React components |

### `@gearu/admin`

| Export | Description |
|--------|-------------|
| `GearuAdmin` | Main admin panel component — handles routing, layout, and plugin integration |
| `GearuAdminLayout` | Lower-level layout component (sidebar, bottom nav, drawer) |
| `GearuAdminProvider` | Context provider for admin state |
| `useGearuAdmin()` | Hook to access admin context (navigation, session, tRPC) |
| `getCoreNavItems()` | Returns the default sidebar navigation items |
| `Select` | Reusable select component |
| `LoadingPlaceholder` | Shimmer skeleton loading component (`variant: "page" | "table" | "form"`) |
| `ModuleErrorBoundary` | Error boundary wrapper for admin routes |

#### `GearuAdmin` Props

```ts
interface GearuAdminProps {
  pathname: string           // Current URL pathname
  basePath: string           // Admin base path (e.g. "/admin")
  plugins?: GearuPlugin[]    // Array of plugin instances
  Link: ComponentType        // Your app's Link component
  useTRPC: () => unknown     // tRPC React hook
  session: { user?: { name?: string; email?: string } } | null
  onSignOut: () => void
  navigate: (path: string) => void
  brandName?: string         // Displayed in sidebar header
}
```

### `@gearu/admin/trpc`

| Export | Description |
|--------|-------------|
| `createGearuTRPCReact()` | Creates typed `TRPCProvider` and `useTRPC` for React |

### `@gearu/plugin-analytics`

| Export | Description |
|--------|-------------|
| `default` | Plugin instance — pass to `plugins` array |
| `createAnalyticsRouter(ctx)` | Factory returning the analytics tRPC router record |
| `pageViews` | Drizzle schema table for page views |
| `AnalyticsPage` | Admin page component |
| `PageTracker` | Client-side component for auto-tracking page views |

### `@gearu/plugin-leads`

| Export | Description |
|--------|-------------|
| `default` | Plugin instance — pass to `plugins` array |
| `createLeadsRouter(ctx)` | Factory returning the leads tRPC router record |
| `leadForms` | Drizzle schema table for lead forms |
| `leads` | Drizzle schema table for captured leads |
| `LeadsPage` | Admin page component |

---

## CLI

```bash
pnpm gearu <command>
```

| Command | Description |
|---------|-------------|
| `gearu init` | Scaffold `gearu.config.ts` and admin route |
| `gearu migrate` | Generate and apply database migrations (`--dry-run` to preview) |
| `gearu upgrade` | Check for package updates and run migrations |
| `gearu collections list` | List all collections (`--json` for JSON output) |
| `gearu collections get <id>` | Get a collection by ID |
| `gearu collections create` | Create a collection (`--name`, `--slug`, `--description`) |
| `gearu collections update <id>` | Update a collection |
| `gearu collections delete <id>` | Delete a collection |
| `gearu entries list` | List entries (`--collection-id`, `--status`, `--limit`, `--offset`) |
| `gearu entries get <id>` | Get an entry by ID |
| `gearu entries create` | Create an entry (`--collection-id`, `--title`, `--slug`, `--status`) |
| `gearu entries update <id>` | Update an entry |
| `gearu entries delete <id>` | Delete an entry |

---

## Import Boundaries

To keep server-only code out of the client bundle:

| Entrypoint | Safe for | Contains |
|------------|----------|----------|
| `@gearu/core` | Server only | `createDb`, schema tables, SEO utilities, generators |
| `@gearu/core/trpc` | Server only | `createGearuTRPC`, router factories |
| `@gearu/core/auth/server` | Server only | `createGearuAuth`, `createGearuAuthServerHelpers` |
| `@gearu/core/auth/client` | Client safe | `createGearuAuthClient` |
| `@gearu/core/client` | Client safe | `definePlugin`, `calculateSeoScore`, optional modules |
| `@gearu/admin` | Client safe | `GearuAdmin`, components, hooks |
| `@gearu/admin/trpc` | Client safe | `createGearuTRPCReact` |

---

## Features

- **Collections & Entries** — Custom content types with 7 field types (text, richtext, number, boolean, image, date, relation)
- **Media Manager** — Drag-and-drop uploads with metadata extraction
- **Comments** — Moderation system (pending, approved, rejected)
- **Content Versioning** — Snapshot history with restore
- **SEO Toolkit** — Meta tags, JSON-LD, sitemaps, robots.txt, OG images, SEO scoring
- **AI Writer** — Bulk article generation from CSV with configurable providers
- **Site Settings** — Metadata, AI config, tracking script injection
- **Authentication** — Session-based with Better Auth
- **Error Boundaries** — Per-module error catching with retry
- **Loading States** — Shimmer skeleton placeholders

## Plugins

| Plugin | Package | Features |
|--------|---------|----------|
| Analytics | `@gearu/plugin-analytics` | Page view tracking, top pages, traffic sources, UTM campaigns, daily trends |
| Leads | `@gearu/plugin-leads` | Dynamic form builder, server-validated capture, UTM attribution, lead management |

## Tech Stack

- [Drizzle ORM](https://orm.drizzle.team) — Type-safe SQL with SQLite/D1
- [tRPC](https://trpc.io) — End-to-end type-safe APIs
- [Better Auth](https://www.better-auth.com) — Authentication
- [TanStack](https://tanstack.com) — React Query, Router, Start

## License

MIT
