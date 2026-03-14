import { useState } from "react"
import { LogOut, X, ExternalLink, LayoutDashboard, Database, FileText, LayoutGrid } from "lucide-react"
import type { ReactNode } from "react"
import type { GearuAdminNavItem, GearuAdminLinkComponent } from "./types"

const DEFAULT_LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="260" height="260"><path fill="currentColor" d="m20.8 241.3c17-17.3 33.9-34.4 50.8-51.6 4.2-4.2 8.4-8.6 12.6-12.8 1.1-1.1 1.5-2.1 1.2-3.7-3.1-15.3-2.6-30.9-2.5-46.3 0-4.3 0.1-8.5 0-12.8 0-1.6 0.5-2.8 1.6-4 8.9-8.9 17.7-17.8 26.5-26.8 0.8-0.8 1.5-1.2 2.6-1.1 13.1 0 26.2 0.1 39.3 0.1 1.2 0.1 2.2-0.3 3.1-1.2q10.9-11.3 22-22.6c1.4-1.4 1.4-2.4-0.1-3.8-8.8-8-8.8-8.1-20.7-8.1-15.7 0-31.5 0.2-47.2-0.1-9.6-0.2-17.2 3-23.8 9.9-10.3 10.8-21 21.2-31.5 31.8-5.4 5.4-7.5 12.1-7.5 19.5q0 36 0 72c0 1.9-0.5 3.3-1.8 4.7-12.6 12.8-25.2 25.6-37.8 38.5-0.3 0.4-0.6 0.8-1.3 0.8-0.8-0.7-0.4-1.7-0.4-2.6-0.1-46.6 0-93.3-0.1-140 0-1.5 0.5-2.6 1.6-3.7q35.1-35.4 70.2-70.8c1.1-1.2 2.4-1.3 3.8-1.3q64.2 0 128.5 0.1 21 0 42 0c0.9 0 2-0.3 3.2 0.5-44.7 45.7-89.3 91.4-133.9 137 1.1 1.4 2.1 1 3.1 1q24.1 0 48.2 0c3.5 0 3.3 0 3.5 3.5 0.3 3.8-0.8 6.7-3.6 9.4-7.7 7.2-15 14.8-22.3 22.2-1.2 1.2-2.4 1.6-4 1.6-12.4 0-24.8 0-37.2 0-1.8 0-2.9 0.6-4.1 1.8-6.9 7.3-13.9 14.4-20.9 21.6-2 2.1-2 2.5 0.3 4.6q0.1 0 0.2 0.1c8.7 7.6 8.7 7.6 22.5 7.1 8.5-0.4 17 0.3 25.5 0 7.9-0.3 15.8 0.4 23.7-0.3 5.7-0.5 10.7-2.8 14.7-6.8 11.8-11.7 23.7-23.4 35.3-35.4 4.1-4.2 6.1-9.6 6.2-15.6 0.1-7.6 0-15.2 0.1-22.8 0-2.2-0.8-2.8-2.9-2.8-12.5 0.1-25 0-37.5 0-1.1 0-2.2 0.3-3.2-0.3-0.1-1.2 0.9-1.7 1.5-2.3 20-20 40-40.1 59.9-60.2 1.6-1.6 2.5-1.4 4 0.1 5.9 6.1 12 12.1 18 18 1 1 1.4 2 1.4 3.3q0 45.5 0 91c0 2-0.7 3.3-2.1 4.6q-34.2 34.3-68.3 68.8c-1.4 1.4-2.9 1.6-4.7 1.6q-77.2 0-154.3 0-7.5 0-15 0c-0.9 0-1.8 0.2-3-0.5 4.6-5.3 9.8-9.8 14.6-14.9z"/></svg>'

const DEFAULT_LOGO_DATA_URL = `data:image/svg+xml,${encodeURIComponent(DEFAULT_LOGO_SVG)}`

export interface GearuAdminLayoutProps {
  basePath: string
  pathname: string
  navItems: GearuAdminNavItem[]
  children: ReactNode
  Link: GearuAdminLinkComponent
  sessionSlot: ReactNode
  onSignOut: () => void
  viewSiteUrl?: string
  logoUrl?: string
  brandName?: string
}

/** Renders the admin shell layout with sidebar, bottom navigation, and responsive drawer. */
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const normalizedBase = basePath.replace(/\/$/, "")

  const isActive = (item: GearuAdminNavItem) => {
    const fullPath = item.path === "/" ? normalizedBase : `${normalizedBase}${item.path}`
    if (item.exact) return pathname === fullPath
    return pathname === fullPath || pathname.startsWith(fullPath + "/")
  }

  const closeDrawer = () => setDrawerOpen(false)
  const closeSidebar = () => setSidebarOpen(false)

  const bottomNavItems: GearuAdminNavItem[] = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { path: "/collections", label: "Collections", icon: Database },
    { path: "/entries", label: "Entries", icon: FileText },
  ]

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Link to={normalizedBase} className="sidebar-brand-link">
            <img src={logoUrl} alt={brandName} className="brand-logo" />
            <span>{brandName}</span>
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className="mobile-close"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => {
              const to = item.path === "/" ? normalizedBase : `${normalizedBase}${item.path}`
              const active = isActive(item)
              const Icon = item.icon
              return (
                <li key={to}>
                  <Link to={to} onClick={closeSidebar} className={active ? "nav-active" : ""}>
                    <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-session">
            {sessionSlot}
          </div>
          <Link to={viewSiteUrl}>
            <ExternalLink size={16} />
            View Site
          </Link>
          <button type="button" onClick={onSignOut} className="sign-out-btn">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop when sidebar is open on mobile */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="admin-sidebar-backdrop"
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-mobile-header">
          <Link to={normalizedBase} className="admin-mobile-header-link">
            <img src={logoUrl} alt={brandName} className="brand-logo" />
            <span>{brandName}</span>
          </Link>
        </header>

        <main className="admin-content">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="admin-bottom-nav" aria-label="Main navigation">
          <div className="admin-bottom-nav-inner">
            {bottomNavItems.map((item) => {
              const to = item.path === "/" ? normalizedBase : `${normalizedBase}${item.path}`
              const active = isActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={to}
                  to={to}
                  className={`admin-bottom-nav-item ${active ? "admin-bottom-nav-item-active" : ""}`}
                >
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="admin-bottom-nav-item"
              aria-label="Open menu"
            >
              <LayoutGrid size={22} />
              <span>More</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Full-screen drawer */}
      {drawerOpen && (
        <>
          <div
            className="admin-drawer-backdrop"
            aria-hidden
            onClick={closeDrawer}
          />
          <div className="admin-drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="admin-drawer-header">
              <span className="admin-drawer-title">{brandName}</span>
              <button
                type="button"
                onClick={closeDrawer}
                className="admin-drawer-close"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            <div className="admin-drawer-user">
              {sessionSlot}
            </div>
            <div className="admin-drawer-grid">
              <div className="admin-drawer-cards">
                {navItems.map((item) => {
                  const to = item.path === "/" ? normalizedBase : `${normalizedBase}${item.path}`
                  const Icon = item.icon
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeDrawer}
                      className="admin-drawer-card"
                    >
                      <span className="admin-drawer-card-icon">
                        <Icon size={28} strokeWidth={1.8} />
                      </span>
                      <span className="admin-drawer-card-label">{item.label}</span>
                    </Link>
                  )
                })}
                <Link to={viewSiteUrl} onClick={closeDrawer} className="admin-drawer-card">
                  <span className="admin-drawer-card-icon">
                    <ExternalLink size={28} strokeWidth={1.8} />
                  </span>
                  <span className="admin-drawer-card-label">View Site</span>
                </Link>
                <button type="button" onClick={() => { closeDrawer(); onSignOut() }} className="admin-drawer-card admin-drawer-card-signout">
                  <span className="admin-drawer-card-icon">
                    <LogOut size={28} strokeWidth={1.8} />
                  </span>
                  <span className="admin-drawer-card-label">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
