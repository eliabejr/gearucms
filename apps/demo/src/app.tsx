import { useState, useCallback, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import superjson from "superjson"
import { TRPCProvider, useTRPC } from "./trpc"
import { GearuAdmin } from "@gearu/admin"
import analyticsPlugin from "@gearu/plugin-analytics"
import leadsPlugin from "@gearu/plugin-leads"
import type { AppRouter } from "./server"

const plugins = [analyticsPlugin, leadsPlugin]

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
})

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
})

function DemoLink({ to, children, className, onClick }: {
  to: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        onClick?.()
        window.history.pushState({}, "", to)
        window.dispatchEvent(new PopStateEvent("popstate"))
      }}
    >
      {children}
    </a>
  )
}

function AdminShell() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handler = () => setPathname(window.location.pathname)
    window.addEventListener("popstate", handler)
    return () => window.removeEventListener("popstate", handler)
  }, [])

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, "", path)
    setPathname(path)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }, [])

  // Redirect root to /admin
  if (pathname === "/") {
    navigate("/admin")
    return null
  }

  return (
    <GearuAdmin
      pathname={pathname}
      basePath="/admin"
      plugins={plugins}
      Link={DemoLink}
      useTRPC={useTRPC as () => unknown}
      session={{ user: { name: "Demo User", email: "demo@gearu.dev" } }}
      onSignOut={() => alert("Sign out (disabled in demo)")}
      navigate={navigate}
      brandName="Gearu Demo"
    />
  )
}

export function App() {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AdminShell />
      </QueryClientProvider>
    </TRPCProvider>
  )
}
