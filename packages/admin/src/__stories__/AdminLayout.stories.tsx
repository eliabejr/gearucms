import type { ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { GearuAdminLayout } from "../gearu-admin-layout"
import { defaultNavItems } from "./storybook-utils"

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

const meta = {
	title: "Layout/GearuAdminLayout",
	component: GearuAdminLayout,
	tags: ["autodocs"],
	args: {
		basePath: "/admin",
		pathname: "/admin/collections",
		navItems: defaultNavItems,
		Link: StoryLink,
		sessionSlot: (
			<>
				<div className="user-avatar">S</div>
				<div className="user-name">Story User</div>
			</>
		),
		onSignOut: () => undefined,
		viewSiteUrl: "/",
		brandName: "Gearu CMS",
		children: (
			<div className="space-y-4 p-6">
				<div className="island-shell p-5">
					<h1 className="mb-2 text-2xl font-bold text-[var(--sea-ink)]">Collections</h1>
					<p className="text-[var(--sea-ink-soft)]">Manage your content models and field definitions.</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="island-shell p-5">Collection card A</div>
					<div className="island-shell p-5">Collection card B</div>
				</div>
			</div>
		),
	},
} satisfies Meta<typeof GearuAdminLayout>

export default meta

type Story = StoryObj<typeof meta>

export const Desktop: Story = {}

export const Mobile: Story = {
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
}
