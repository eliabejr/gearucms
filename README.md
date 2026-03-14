# Gearu

Open-source headless CMS that installs inside your React project. Built on TanStack Start, Drizzle ORM, tRPC, and Better Auth.

## Quick Start

### 1. Install

```bash
pnpm add @gearu/core @gearu/admin drizzle-kit better-sqlite3
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
import Database from "better-sqlite3"
import analyticsPlugin from "@gearu/plugin-analytics"
import leadsPlugin from "@gearu/plugin-leads"
import { createDb } from "@gearu/core"
import { createGearuTRPC, createGearuRouterRecord } from "@gearu/core/trpc"
import { createAnalyticsRouter } from "@gearu/plugin-analytics"
import { createLeadsRouter } from "@gearu/plugin-leads"

export interface TRPCContext {
  headers: Headers
  session: { user?: { id?: string } } | null
}

const connection = new Database("./dev.db")
const db = createDb(connection, {
  plugins: [analyticsPlugin, leadsPlugin],
})

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

### 6. Set up auth

Auth is split into **server-only** and **client-safe** entrypoints so TanStack Start (and other bundlers) never pull server code into the browser:

- **`@gearu/core/auth/server`** — server only: `createGearuAuth`, `createGearuAuthServerHelpers`. Use in server modules, API routes, and server functions.
- **`@gearu/core/auth/client`** — client safe: `createGearuAuthClient`. Use in client components and any code that runs in the browser.

Do not import from a single mixed auth barrel; the package no longer exposes one.

```ts
// src/lib/auth.ts (server only)
import { createGearuAuth } from "@gearu/core/auth/server"
import { db } from "../db"

export const auth = createGearuAuth(db, {
  secret: process.env.BETTER_AUTH_SECRET,
})
```

```ts
// src/lib/auth-client.ts (client safe — use in routes/components that run in the browser)
import { createGearuAuthClient } from "@gearu/core/auth/client"

export const authClient = createGearuAuthClient()
```

```ts
// src/lib/auth.server.ts (server only)
import { createGearuAuthServerHelpers } from "@gearu/core/auth/server"
import { auth } from "./auth"

export const { getSession, ensureSession } = createGearuAuthServerHelpers(auth)
```

```tsx
// src/routes/api/auth/$.tsx (server only — catch-all for Better Auth)
import { createFileRoute } from "@tanstack/react-router"
import { auth } from "../../../lib/auth"

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => auth.handler(request),
      POST: async ({ request }) => auth.handler(request),
    },
  },
})
```

Optional login/signup routes (client components that use `authClient`):

```tsx
// src/routes/login.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { authClient } from "../lib/auth-client"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const email = (form.elements.namedItem("email") as HTMLInputElement).value
        const password = (form.elements.namedItem("password") as HTMLInputElement).value
        await authClient.signIn.email({ email, password, callbackURL: "/admin" })
        navigate({ to: "/admin" })
      }}
    >
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Sign in</button>
    </form>
  )
}
```

```tsx
// src/routes/signup.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { authClient } from "../lib/auth-client"

export const Route = createFileRoute("/signup")({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const form = e.currentTarget
        const email = (form.elements.namedItem("email") as HTMLInputElement).value
        const password = (form.elements.namedItem("password") as HTMLInputElement).value
        const name = (form.elements.namedItem("name") as HTMLInputElement).value
        await authClient.signUp.email({ email, password, name, callbackURL: "/admin" })
        navigate({ to: "/admin" })
      }}
    >
      <input name="name" type="text" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Sign up</button>
    </form>
  )
}
```

### 7. Add admin route

Create a catch-all admin route that renders the Gearu admin panel. **You must import the admin CSS** (e.g. in this route or in your root layout) so the panel is styled correctly:

```tsx
// src/routes/admin/route.tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { getSession } from "../../lib/auth.server"

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

Use `ensureSession` when protecting server functions:

```ts
// src/lib/posts.server.ts
import { createServerFn } from "@tanstack/react-start"
import { ensureSession } from "./auth.server"

export const createPost = createServerFn({ method: "POST" })
  .inputValidator((data: { title: string }) => data)
  .handler(async ({ data }) => {
    const session = await ensureSession()

    return {
      title: data.title,
      authorId: session.user.id,
    }
  })
```

### 8. Add SEO routes (optional)

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

### 9. Environment variables

```env
DATABASE_URL=file:./dev.db
BETTER_AUTH_SECRET=your-secret-here
SITE_URL=http://localhost:3000
```

## Import boundaries (TanStack Start)

To avoid server-only code ending up in the client bundle:

- **Client-safe** (use in components and any code that runs in the browser):  
  `@gearu/core/auth/client`, `@gearu/core/client` (plugin types, optional modules, SEO score).
- **Server-only** (use in server modules, API routes, `createServerFn` handlers):  
  `@gearu/core`, `@gearu/core/trpc`, `@gearu/core/auth/server`.

Do not import `@gearu/core/auth/server` or the root `@gearu/core` (which exports `createDb` and schema) from client components or from files that are part of the client route tree. Keep auth server setup and helpers in separate modules (e.g. `auth.ts`, `auth.server.ts`) and import them only from server routes or server functions.

To verify that client artifacts do not contain server-only code, run from the repo root: `pnpm run test:auth-boundary` (builds `@gearu/core` and runs the auth bundle boundary check).

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

**Using plugins:** Inside this monorepo, plugins are linked via `workspace:*`. For an external app, install the published packages from npm when available (`pnpm add @gearu/plugin-analytics @gearu/plugin-leads`). If a plugin is not yet published, you need to use the monorepo (clone and link) or build and link the plugin package locally until a coordinated publish is available.

## Tech Stack

- [TanStack Start](https://tanstack.com/start) — Full-stack React framework
- [Drizzle ORM](https://orm.drizzle.team) — Type-safe SQL with SQLite/D1
- [tRPC](https://trpc.io) — End-to-end type-safe APIs
- [Better Auth](https://www.better-auth.com) — Authentication
- [Tailwind CSS](https://tailwindcss.com) — Styling

## License

MIT
