import { createContext, useContext, type ReactNode } from "react"

/** Optional rich text editor (e.g. TipTap) - host can pass for entry edit screens */
export type RichTextEditorComponent = React.ComponentType<{
	content: string
	onChange: (html: string) => void
	placeholder?: string
}>

/**
 * Host provides useTRPC (from createTRPCContext), Link component, and basePath.
 * Admin screens use this context to stay framework-agnostic.
 */
export interface GearuAdminContextValue {
	useTRPC: () => unknown
	Link: React.ComponentType<{
		to: string
		params?: Record<string, string>
		children: ReactNode
		className?: string
		onClick?: () => void
	}>
	basePath: string
	/** Route params (e.g. { id: "123" } for /entries/123) */
	params: Record<string, string>
	/** Programmatic navigation (full path e.g. /admin/entries) */
	navigate: (path: string) => void
	session: { user?: { name?: string; email?: string } } | null
	onSignOut: () => void
	versionBanner?: ReactNode
	/** Optional: rich text editor for entry fields (e.g. TipTap from host) */
	RichTextEditor?: RichTextEditorComponent
}

const GearuAdminContext = createContext<GearuAdminContextValue | null>(null)

export function GearuAdminProvider({
	value,
	children,
}: {
	value: GearuAdminContextValue
	children: ReactNode
}) {
	return (
		<GearuAdminContext.Provider value={value}>
			{children}
		</GearuAdminContext.Provider>
	)
}

export function useGearuAdmin() {
	const ctx = useContext(GearuAdminContext)
	if (!ctx) throw new Error("useGearuAdmin must be used within GearuAdminProvider")
	return ctx
}
