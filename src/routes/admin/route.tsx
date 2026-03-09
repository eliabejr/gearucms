import {
	createFileRoute,
	Outlet,
	Link,
	redirect,
	useMatchRoute,
	useNavigate,
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
	ExternalLink,
	UserPlus,
} from "lucide-react"
import { useState } from "react"
import { authClient } from "#/lib/auth-client"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { auth } from "#/lib/auth"
import "#/styles/admin.css"

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
	{ to: "/admin/leads" as const, label: "Leads", icon: UserPlus },
	{ to: "/admin/analytics" as const, label: "Analytics", icon: BarChart3 },
	{ to: "/admin/settings" as const, label: "Settings", icon: Settings },
	{ to: "/admin/ai-writer" as const, label: "AI Writer", icon: Sparkles },
]

function AdminLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const matchRoute = useMatchRoute()
	const navigate = useNavigate()
	const { data: session } = authClient.useSession()

	const handleSignOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					navigate({ to: "/login" })
				},
			},
		})
	}

	return (
		<div className="admin-layout flex h-screen bg-[var(--bg-base)]">
			{/* Mobile overlay */}
			{sidebarOpen && (
				<button
					type="button"
					aria-label="Close sidebar"
					className="fixed inset-0 z-30 cursor-default bg-black/40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`sidebar fixed inset-y-0 left-0 z-40 flex w-60 flex-col transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
			>
				{/* Brand */}
				<div className="sidebar-brand flex items-center justify-between px-4 py-3.5">
					<Link
						to="/admin"
						className="flex items-center gap-2.5 no-underline"
					>
						<img
							src="/gearu.svg"
							alt="Gearu"
							className="brand-logo h-5 w-5"
						/>
						<span className="text-[15px] font-bold tracking-tight">
							Gearu
						</span>
					</Link>
					<button
						type="button"
						onClick={() => setSidebarOpen(false)}
						className="mobile-close rounded-md p-1 lg:hidden"
					>
						<X size={18} />
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex-1 overflow-y-auto px-2.5 py-3">
					<ul className="flex flex-col gap-0.5">
						{navItems.map((item) => {
							const isActive = item.exact
								? matchRoute({ to: item.to, fuzzy: false })
								: matchRoute({ to: item.to, fuzzy: true })

							return (
								<li key={item.to}>
									<Link
										to={item.to}
										onClick={() => setSidebarOpen(false)}
										className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium no-underline transition ${
											isActive ? "nav-active" : ""
										}`}
									>
										<item.icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
										{item.label}
									</Link>
								</li>
							)
						})}
					</ul>
				</nav>

				{/* Footer */}
				<div className="sidebar-footer px-2.5 py-3">
					{/* User */}
					<div className="mb-1 flex items-center gap-2.5 rounded-md px-2.5 py-2">
						<div className="user-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
							{session?.user?.name?.[0]?.toUpperCase() ?? "U"}
						</div>
						<div className="user-name flex-1 truncate text-[13px] font-medium">
							{session?.user?.name ?? session?.user?.email ?? "User"}
						</div>
					</div>

					{/* Actions */}
					<Link
						to="/"
						className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium no-underline transition"
					>
						<ExternalLink size={16} />
						View Site
					</Link>
					<button
						type="button"
						onClick={handleSignOut}
						className="sign-out-btn flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition"
					>
						<LogOut size={16} />
						Sign Out
					</button>
				</div>
			</aside>

			{/* Main content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Mobile header */}
				<header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--sand)] px-4 py-3 lg:hidden">
					<button
						type="button"
						onClick={() => setSidebarOpen(true)}
						className="rounded-md p-1.5 text-[var(--text-soft)] hover:bg-[var(--surface-soft)]"
					>
						<Menu size={18} />
					</button>
					<div className="flex items-center gap-2">
						<img src="/gearu.svg" alt="Gearu" className="h-4 w-4" />
						<span className="text-sm font-semibold text-[var(--text)]">
							Gearu
						</span>
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-4 lg:p-6">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
