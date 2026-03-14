import { useState } from "react"
import { LogOut, Menu, X, ExternalLink } from "lucide-react"
import type { ReactNode } from "react"
import type { GearuAdminNavItem, GearuAdminLinkComponent } from "./types"

/** Inline default logo (Gearu gear) so the admin works without host providing /gearu.svg */
const DEFAULT_LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="260" height="260"><path fill="currentColor" d="m20.8 241.3c17-17.3 33.9-34.4 50.8-51.6 4.2-4.2 8.4-8.6 12.6-12.8 1.1-1.1 1.5-2.1 1.2-3.7-3.1-15.3-2.6-30.9-2.5-46.3 0-4.3 0.1-8.5 0-12.8 0-1.6 0.5-2.8 1.6-4 8.9-8.9 17.7-17.8 26.5-26.8 0.8-0.8 1.5-1.2 2.6-1.1 13.1 0 26.2 0.1 39.3 0.1 1.2 0.1 2.2-0.3 3.1-1.2q10.9-11.3 22-22.6c1.4-1.4 1.4-2.4-0.1-3.8-8.8-8-8.8-8.1-20.7-8.1-15.7 0-31.5 0.2-47.2-0.1-9.6-0.2-17.2 3-23.8 9.9-10.3 10.8-21 21.2-31.5 31.8-5.4 5.4-7.5 12.1-7.5 19.5q0 36 0 72c0 1.9-0.5 3.3-1.8 4.7-12.6 12.8-25.2 25.6-37.8 38.5-0.3 0.4-0.6 0.8-1.3 0.8-0.8-0.7-0.4-1.7-0.4-2.6-0.1-46.6 0-93.3-0.1-140 0-1.5 0.5-2.6 1.6-3.7q35.1-35.4 70.2-70.8c1.1-1.2 2.4-1.3 3.8-1.3q64.2 0 128.5 0.1 21 0 42 0c0.9 0 2-0.3 3.2 0.5-44.7 45.7-89.3 91.4-133.9 137 1.1 1.4 2.1 1 3.1 1q24.1 0 48.2 0c3.5 0 3.3 0 3.5 3.5 0.3 3.8-0.8 6.7-3.6 9.4-7.7 7.2-15 14.8-22.3 22.2-1.2 1.2-2.4 1.6-4 1.6-12.4 0-24.8 0-37.2 0-1.8 0-2.9 0.6-4.1 1.8-6.9 7.3-13.9 14.4-20.9 21.6-2 2.1-2 2.5 0.3 4.6q0.1 0 0.2 0.1c8.7 7.6 8.7 7.6 22.5 7.1 8.5-0.4 17 0.3 25.5 0 7.9-0.3 15.8 0.4 23.7-0.3 5.7-0.5 10.7-2.8 14.7-6.8 11.8-11.7 23.7-23.4 35.3-35.4 4.1-4.2 6.1-9.6 6.2-15.6 0.1-7.6 0-15.2 0.1-22.8 0-2.2-0.8-2.8-2.9-2.8-12.5 0.1-25 0-37.5 0-1.1 0-2.2 0.3-3.2-0.3-0.1-1.2 0.9-1.7 1.5-2.3 20-20 40-40.1 59.9-60.2 1.6-1.6 2.5-1.4 4 0.1 5.9 6.1 12 12.1 18 18 1 1 1.4 2 1.4 3.3q0 45.5 0 91c0 2-0.7 3.3-2.1 4.6q-34.2 34.3-68.3 68.8c-1.4 1.4-2.9 1.6-4.7 1.6q-77.2 0-154.3 0-7.5 0-15 0c-0.9 0-1.8 0.2-3-0.5 4.6-5.3 9.8-9.8 14.6-14.9z"/></svg>'

const DEFAULT_LOGO_DATA_URL = `data:image/svg+xml,${encodeURIComponent(DEFAULT_LOGO_SVG)}`

export interface GearuAdminLayoutProps {
  /** Base path for admin (e.g. "/admin") */
  basePath: string
  /** Current pathname (e.g. "/admin/collections") - used to highlight active nav */
  pathname: string
  /** Nav items (core + plugins). path is relative to basePath */
  navItems: GearuAdminNavItem[]
  /** Main content (matched route component) */
  children: ReactNode
  /** Host's Link component for navigation */
  Link: GearuAdminLinkComponent
  /** Session display (user name, avatar) */
  sessionSlot: ReactNode
  /** Sign out handler */
  onSignOut: () => void
  /** "View site" URL (e.g. "/") */
  viewSiteUrl?: string
  /** Logo URL (e.g. "/gearu.svg") or leave unset to use bundled default */
  logoUrl?: string
  /** Brand name */
  brandName?: string
}

/** Renders the admin shell layout with sidebar navigation and responsive mobile menu. */
export function GearuAdminLayout({
  basePath,
  pathname,
  navItems,
  children,
  Link,
  sessionSlot,
  onSignOut,
  viewSiteUrl = "/",
  logoUrl = DEFAULT_LOGO_DATA_URL,
  brandName = "Gearu",
}: GearuAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const normalizedBase = basePath.replace(/\/$/, "")

  const isActive = (item: GearuAdminNavItem) => {
    const fullPath = item.path === "/" ? normalizedBase : `${normalizedBase}${item.path}`
    if (item.exact) return pathname === fullPath
    return pathname === fullPath || pathname.startsWith(fullPath + "/")
  }

  return (
    <div className="admin-layout flex h-screen bg-[var(--bg-base)]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 cursor-default bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar fixed inset-y-0 left-0 z-40 flex w-60 flex-col transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="sidebar-brand flex items-center justify-between px-4 py-3.5">
          <Link to={normalizedBase} className="flex items-center gap-2.5 no-underline">
            <img src={logoUrl} alt={brandName} className="brand-logo h-5 w-5" />
            <span className="text-[15px] font-bold tracking-tight">{brandName}</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="mobile-close rounded-md p-1 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const to = item.path === "/" ? normalizedBase : `${normalizedBase}${item.path}`
              const active = isActive(item)
              const Icon = item.icon
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium no-underline transition ${active ? "nav-active" : ""}`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="sidebar-footer px-2.5 py-3">
          <div className="mb-1 flex items-center gap-2.5 rounded-md px-2.5 py-2">
            {sessionSlot}
          </div>
          <Link
            to={viewSiteUrl}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium no-underline transition"
          >
            <ExternalLink size={16} />
            View Site
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="sign-out-btn flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--sand)] px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-[var(--text-soft)] hover:bg-[var(--surface-soft)]"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt={brandName} className="h-4 w-4" />
            <span className="text-sm font-semibold text-[var(--text)]">{brandName}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[var(--bg-base)]">{children}</main>
      </div>
    </div>
  )
}
