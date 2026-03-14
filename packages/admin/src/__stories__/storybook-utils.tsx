import type { ReactNode } from "react"
import type { Decorator } from "@storybook/react"
import type { GearuAdminNavItem } from "../types"
import { GearuAdminProvider, type GearuAdminContextValue } from "../context"
import { getCoreNavItems } from "../core-nav"

function StoryLink({
	to,
	children,
	className,
	onClick,
}: {
	to: string
	children: ReactNode
	className?: string
	onClick?: () => void
}) {
	return (
		<a href={to} className={className} onClick={onClick}>
			{children}
		</a>
	)
}

export const defaultAdminContext: GearuAdminContextValue = {
	useTRPC: () => ({}),
	Link: StoryLink,
	basePath: "/admin",
	params: {},
	navigate: () => undefined,
	session: {
		user: {
			name: "Story User",
			email: "story@example.com",
		},
	},
	onSignOut: () => undefined,
	versionBanner: <div className="mb-4 rounded-lg bg-[var(--foam)] px-3 py-2 text-sm">Version 1.3.0</div>,
}

export const withAdminProvider: Decorator = (Story) => (
	<GearuAdminProvider value={defaultAdminContext}>
		<div style={{ padding: "1rem", background: "var(--sand)", minHeight: "100vh" }}>
			<Story />
		</div>
	</GearuAdminProvider>
)

export const defaultNavItems: GearuAdminNavItem[] = getCoreNavItems()
