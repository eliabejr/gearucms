import type { ComponentType } from "react"
import { OPTIONAL_ADMIN_MODULES } from "@gearu/core"
import { GearuAdminLayout } from "./gearu-admin-layout"
import { GearuAdminProvider } from "./context"
import { getCoreNavItems } from "./core-nav"
import { getCoreRoutes } from "./routes"
import type { GearuPlugin } from "@gearu/core"

/** Props for the top-level Gearu admin shell. */
export interface GearuAdminProps {
	pathname: string
	basePath: string
	plugins?: GearuPlugin[]
	Link: ComponentType<{ to: string; params?: Record<string, string>; children: React.ReactNode; className?: string; onClick?: () => void }>
	useTRPC: () => unknown
	session: { user?: { name?: string; email?: string } } | null
	onSignOut: () => void
	versionBanner?: React.ReactNode
	viewSiteUrl?: string
	logoUrl?: string
	brandName?: string
	RichTextEditor?: ComponentType<{ content: string; onChange: (html: string) => void; placeholder?: string }>
	/** Programmatic navigation (full path e.g. /admin/entries) */
	navigate: (path: string) => void
}

function normalizePath(basePath: string, pathname: string): string {
	const base = basePath.replace(/\/$/, "")
	if (pathname === base) return "/"
	if (!pathname.startsWith(base + "/")) return "/"
	return "/" + pathname.slice(base.length + 1).replace(/\/$/, "") || "/"
}

function matchRoute(
	internalPath: string,
	routes: { path: string; Component: ComponentType }[],
): { Component: ComponentType; params?: Record<string, string> } | null {
	const exact = routes.find((r) => r.path === internalPath)
	if (exact) return { Component: exact.Component }

	const segments = internalPath.split("/").filter(Boolean)
	for (const route of routes) {
		const routeSegments = route.path.split("/").filter(Boolean)
		if (routeSegments.length !== segments.length) continue
		const params: Record<string, string> = {}
		let match = true
		for (let i = 0; i < routeSegments.length; i++) {
			if (routeSegments[i]!.startsWith(":")) {
				params[routeSegments[i]!.slice(1)] = segments[i]!
			} else if (routeSegments[i] !== segments[i]) {
				match = false
				break
			}
		}
		if (match) return { Component: route.Component, params }
	}
	return null
}

/** Renders the Gearu admin panel with routing, layout, and plugin integration. */
export function GearuAdmin({
	pathname,
	basePath,
	plugins = [],
	Link,
	useTRPC,
	session,
	onSignOut,
	versionBanner,
	viewSiteUrl = "/",
	logoUrl = "/gearu.svg",
	brandName = "Gearu",
	RichTextEditor,
	navigate,
}: GearuAdminProps) {
	const internalPath = normalizePath(basePath, pathname)
	const coreRoutes = getCoreRoutes()
	const pluginRoutes = plugins
		.filter((p): p is GearuPlugin & { admin: NonNullable<GearuPlugin["admin"]> } => !!p.admin)
		.map((p) => ({ path: p.admin.route.path, Component: p.admin.route.Component }))
	const allRoutes = [...pluginRoutes, ...coreRoutes]
	const match = matchRoute(internalPath, allRoutes)

	const coreNav = getCoreNavItems()
	const optionalPaths = new Set<string>(OPTIONAL_ADMIN_MODULES.map((m) => m.path))
	const pluginNavItems = plugins
		.filter((p): p is GearuPlugin & { admin: NonNullable<GearuPlugin["admin"]> } => !!p.admin)
		.map((p) => ({
			path: p.admin.navItem.path,
			label: p.admin.navItem.label,
			icon: p.admin.navItem.icon,
		}))
		.filter((item) => !optionalPaths.has(item.path))
	const navItems = [...coreNav, ...pluginNavItems]

	const sessionSlot = (
		<>
			<div className="user-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
				{session?.user?.name?.[0]?.toUpperCase() ?? "U"}
			</div>
			<div className="user-name flex-1 truncate text-[13px] font-medium">
				{session?.user?.name ?? session?.user?.email ?? "User"}
			</div>
		</>
	)

	const Child = match?.Component ?? (() => <div className="p-6 text-[var(--sea-ink-soft)]">Not found</div>)

	const contextValue = {
		useTRPC,
		Link,
		basePath,
		params: match?.params ?? {},
		navigate,
		session,
		onSignOut,
		versionBanner,
		RichTextEditor,
	}

	return (
		<GearuAdminProvider value={contextValue}>
		<GearuAdminLayout
			basePath={basePath}
			pathname={pathname}
			navItems={navItems}
			Link={Link as any}
			sessionSlot={sessionSlot}
			onSignOut={onSignOut}
			viewSiteUrl={viewSiteUrl}
			logoUrl={logoUrl}
			brandName={brandName}
		>
			{versionBanner}
			<Child />
		</GearuAdminLayout>
		</GearuAdminProvider>
	)
}
