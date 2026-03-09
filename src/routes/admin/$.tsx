import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router"
import { GearuAdmin } from "@gearu/admin"
import leadsPlugin from "@gearu/plugin-leads"
import analyticsPlugin from "@gearu/plugin-analytics"
import { authClient } from "#/lib/auth-client"
import { useTRPC } from "#/integrations/trpc/react"
import { GearuVersionBanner } from "#/components/GearuVersionBanner"
import TipTapEditor from "#/components/TipTapEditor"
import "@gearu/admin/styles.css"

export const Route = createFileRoute("/admin/$")({
	component: AdminSplat,
})

function AdminSplat() {
	const location = useLocation()
	const navigate = useNavigate()
	const { data: session } = authClient.useSession()

	return (
		<GearuAdmin
			pathname={location.pathname}
			basePath="/admin"
			plugins={[leadsPlugin, analyticsPlugin]}
			Link={Link as React.ComponentType<{ to: string; params?: Record<string, string>; children: React.ReactNode; className?: string; onClick?: () => void }>}
			useTRPC={useTRPC}
			session={session ?? null}
			onSignOut={() => {
				authClient.signOut({
					fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
				})
			}}
			navigate={(path) => navigate({ to: path })}
			RichTextEditor={TipTapEditor}
			versionBanner={<GearuVersionBanner />}
			viewSiteUrl="/"
			logoUrl="/gearu.svg"
			brandName="Gearu"
		/>
	)
}
