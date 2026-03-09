import { useState } from "react"
import { LogOut, Menu, X, ExternalLink } from "lucide-react"
import type { ReactNode } from "react"
import type { GearuAdminNavItem, GearuAdminLinkComponent } from "./types"

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
  /** Logo URL (e.g. "/gearu.svg") */
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
  logoUrl = "/gearu.svg",
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

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
