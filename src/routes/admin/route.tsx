import {
	createFileRoute,
	Outlet,
	Link,
	redirect,
	useMatchRoute,
} from "@tanstack/react-router"
import {
	LayoutDashboard,
	Database,
	FileText,
	ImageIcon,
	MessageSquare,
	BarChart3,
	Settings,
	Sparkles,
	LogOut,
	Menu,
	X,
} from "lucide-react"
import { useState } from "react"
import { authClient } from "#/lib/auth-client"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { auth } from "#/lib/auth"

const getSession = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest()
	const session = await auth.api.getSession({ headers: request.headers })
	return session
})

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const session = await getSession()
		if (!session?.user) {
			throw redirect({ to: "/login" })
		}
	},
	component: AdminLayout,
})

const navItems = [
	{ to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
	{ to: "/admin/collections" as const, label: "Collections", icon: Database },
	{ to: "/admin/entries" as const, label: "Entries", icon: FileText },
	{ to: "/admin/media" as const, label: "Media", icon: ImageIcon },
	{ to: "/admin/comments" as const, label: "Comments", icon: MessageSquare },
	{ to: "/admin/analytics" as const, label: "Analytics", icon: BarChart3 },
	{ to: "/admin/settings" as const, label: "Settings", icon: Settings },
	{ to: "/admin/ai-writer" as const, label: "AI Writer", icon: Sparkles },
]

function AdminLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const matchRoute = useMatchRoute()
	const { data: session } = authClient.useSession()

	return (
		<div className="flex h-screen bg-[var(--foam)]">
			{/* Mobile overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
					onKeyDown={() => {}}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--line)] bg-[var(--sand)] transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
			>
				<div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-4">
					<Link
						to="/admin"
						className="flex items-center gap-2 text-lg font-bold text-[var(--sea-ink)] no-underline"
					>
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--lagoon)] text-sm font-bold text-white">
							C
						</span>
						CMS
					</Link>
					<button
						type="button"
						onClick={() => setSidebarOpen(false)}
						className="rounded-lg p-1 text-[var(--sea-ink-soft)] hover:bg-[var(--foam)] lg:hidden"
					>
						<X size={20} />
					</button>
				</div>

				<nav className="flex-1 overflow-y-auto p-3">
					<ul className="flex flex-col gap-1">
						{navItems.map((item) => {
							const isActive = item.exact
								? matchRoute({ to: item.to, fuzzy: false })
								: matchRoute({ to: item.to, fuzzy: true })

							return (
								<li key={item.to}>
									<Link
										to={item.to}
										onClick={() => setSidebarOpen(false)}
										className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition ${
											isActive
												? "bg-[var(--lagoon)] text-white"
												: "text-[var(--sea-ink-soft)] hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]"
										}`}
									>
										<item.icon size={18} />
										{item.label}
									</Link>
								</li>
							)
						})}
					</ul>
				</nav>

				<div className="border-t border-[var(--line)] p-3">
					<div className="mb-2 flex items-center gap-2 px-3 py-1">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lagoon)] text-xs font-bold text-white">
							{session?.user?.name?.[0]?.toUpperCase() ?? "U"}
						</div>
						<div className="flex-1 truncate text-sm text-[var(--sea-ink)]">
							{session?.user?.name ?? session?.user?.email ?? "User"}
						</div>
					</div>
					<button
						type="button"
						onClick={() => authClient.signOut()}
						className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)] transition hover:bg-[var(--foam)] hover:text-red-600"
					>
						<LogOut size={18} />
						Sign Out
					</button>
					<Link
						to="/"
						className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--foam)]"
					>
						View Site
					</Link>
				</div>
			</aside>

			{/* Main content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Mobile header */}
				<header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--sand)] px-4 py-3 lg:hidden">
					<button
						type="button"
						onClick={() => setSidebarOpen(true)}
						className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] hover:bg-[var(--foam)]"
					>
						<Menu size={20} />
					</button>
					<span className="text-sm font-semibold text-[var(--sea-ink)]">
						CMS Admin
					</span>
				</header>

				<main className="flex-1 overflow-y-auto p-4 lg:p-6">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
