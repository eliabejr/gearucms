/**
 * Optional admin modules that may be provided by plugins.
 * When a plugin is not installed, the admin shows a "missing module" screen for these paths.
 */
export const OPTIONAL_ADMIN_MODULES = [
	{ path: "/leads", slug: "leads", name: "Leads" },
	{ path: "/analytics", slug: "analytics", name: "Analytics" },
] as const

export type OptionalAdminModule = (typeof OPTIONAL_ADMIN_MODULES)[number]

/** Finds an optional admin module definition by its path. */
export function getOptionalModuleByPath(path: string): OptionalAdminModule | undefined {
	return OPTIONAL_ADMIN_MODULES.find((m) => m.path === path)
}
