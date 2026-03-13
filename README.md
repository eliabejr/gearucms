# Gearu

Open-source headless CMS that installs inside your React project. Built on TanStack Start, Drizzle ORM, tRPC, and Better Auth.

## Quick Start

### 1. Install

```bash
pnpm add @gearu/core @gearu/admin drizzle-kit
```

### 2. Install plugins (optional)

```bash
pnpm add @gearu/plugin-analytics @gearu/plugin-leads
```

### 3. Create config

Create `gearu.config.ts` at your project root:

```ts
export default {
  database: "file:./dev.db",
  plugins: ["@gearu/plugin-leads", "@gearu/plugin-analytics"],
}
```

### 4. Set up the database

Add the Gearu schema to your Drizzle config:

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: [
    "./node_modules/@gearu/core/dist/index.js",
    // Add plugin schemas as needed
  ],
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: "./dev.db" },
})
```

Or import the tables directly in your existing schema:

```ts
// src/db/schema.ts
export * from "@gearu/core"
```

Run migrations:

```bash
pnpm drizzle-kit push
```

### 5. Set up tRPC

Gearu ships the reusable tRPC server/client helpers in the packages, so the host app only needs to wire them to its own `AppRouter`.

```ts
// src/trpc/router.ts
import { createGearuTRPC, createGearuRouterRecord } from "@gearu/core/trpc"
import { createAnalyticsRouter } from "@gearu/plugin-analytics"
import { createLeadsRouter } from "@gearu/plugin-leads"

export interface TRPCContext {
  headers: Headers
  session: { user?: { id?: string } } | null
}

export const { createTRPCRouter, publicProcedure, protectedProcedure, TRPCError } =
  createGearuTRPC<TRPCContext>()

export const appRouter = createTRPCRouter({
  ...createGearuRouterRecord({ db, publicProcedure, protectedProcedure }),
  analytics: createAnalyticsRouter({ db, publicProcedure, protectedProcedure }),
  leads: createLeadsRouter({ db, publicProcedure, protectedProcedure, TRPCError }),
})

export type AppRouter = typeof appRouter
```

```ts
// src/trpc/client.ts
import { createGearuTRPCReact } from "@gearu/admin/trpc"
import type { AppRouter } from "./router"

export const { TRPCProvider, useTRPC } = createGearuTRPCReact<AppRouter>()
```

### 6. Add admin route

Create a catch-all admin route that renders the Gearu admin panel:

```tsx
// src/routes/admin/route.tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const { auth } = await import("./lib/auth")
  const request = getRequest()
  return auth.api.getSession({ headers: request.headers })
})

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session?.user) throw redirect({ to: "/login" })
  },
  component: () => <Outlet />,
})
```

```tsx
// src/routes/admin/$.tsx
import { createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router"
import { GearuAdmin } from "@gearu/admin"
import "@gearu/admin/styles.css"
import { useTRPC } from "../trpc/client"
import { authClient } from "../lib/auth-client"

// Import plugins
import leadsPlugin from "@gearu/plugin-leads"
import analyticsPlugin from "@gearu/plugin-analytics"

export const Route = createFileRoute("/admin/$")({
  component: AdminPage,
})

function AdminPage() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <GearuAdmin
      pathname={location.pathname}
      basePath="/admin"
      plugins={[leadsPlugin, analyticsPlugin]}
      Link={Link}
      useTRPC={useTRPC}
      session={session}
      onSignOut={() => authClient.signOut({ fetchOptions: { onSuccess: () => navigate({ to: "/login" }) } })}
      navigate={(path) => navigate({ to: path })}
    />
  )
}
```

### 7. Add SEO routes (optional)

Gearu provides utilities for robots.txt, sitemaps, and OG images:

```ts
// src/routes/api/robots.ts
import { createFileRoute } from "@tanstack/react-router"
import { getSiteUrl, generateRobotsTxt } from "@gearu/core"

export const Route = createFileRoute("/api/robots")({
  server: {
    handlers: {
      GET: async () => {
        const body = generateRobotsTxt(getSiteUrl())
        return new Response(body, { headers: { "Content-Type": "text/plain" } })
      },
    },
  },
})
```

### 8. Environment variables

```env
DATABASE_URL=file:./dev.db
BETTER_AUTH_SECRET=your-secret-here
SITE_URL=http://localhost:3000
```

## Features

- **Collections & Entries** — Define content types with custom fields (text, richtext, number, boolean, image, date, relation)
- **Media Manager** — Upload and manage files with drag-and-drop
- **Comments** — Built-in comment system with moderation (pending, approved, rejected)
- **SEO** — Meta tags, JSON-LD, sitemap, robots.txt, OG image generation, SEO scoring
- **AI Writer** — Bulk article generation from CSV with configurable system prompts and models
- **Content Versioning** — Track and restore content revisions
- **Settings** — Site metadata, AI provider config, tracking script injection

## Plugins

| Plugin | Package | Description |
|--------|---------|-------------|
| Analytics | `@gearu/plugin-analytics` | Page view tracking, top pages, traffic sources, UTM campaigns |
| Leads | `@gearu/plugin-leads` | Dynamic form builder, lead capture with UTM tracking, CSV export |

## Tech Stack

- [TanStack Start](https://tanstack.com/start) — Full-stack React framework
- [Drizzle ORM](https://orm.drizzle.team) — Type-safe SQL with SQLite/D1
- [tRPC](https://trpc.io) — End-to-end type-safe APIs
- [Better Auth](https://www.better-auth.com) — Authentication
- [Tailwind CSS](https://tailwindcss.com) — Styling

## License

MIT
