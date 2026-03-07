import { createFileRoute, Link } from "@tanstack/react-router"
import {
	FileText,
	Eye,
	MessageSquare,
	Sparkles,
	Plus,
	Database,
} from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery } from "@tanstack/react-query"

export const Route = createFileRoute("/admin/")({
	component: AdminDashboard,
})

function StatCard({
	label,
	value,
	icon: Icon,
	color = "var(--lagoon)",
}: {
	label: string
	value: string | number
	icon: React.ComponentType<{ size?: number }>
	color?: string
}) {
	return (
		<div className="island-shell flex items-center gap-4 p-5">
			<div
				className="flex h-12 w-12 items-center justify-center rounded-xl"
				style={{ backgroundColor: `${color}20`, color }}
			>
				<Icon size={24} />
			</div>
			<div>
				<p className="text-2xl font-bold text-[var(--sea-ink)]">{value}</p>
				<p className="text-sm text-[var(--sea-ink-soft)]">{label}</p>
			</div>
		</div>
	)
}

function AdminDashboard() {
	const trpc = useTRPC()

	const { data: entriesList } = useQuery(
		trpc.entries.list.queryOptions({ limit: 5 }),
	)
	const { data: commentsList } = useQuery(
		trpc.comments.list.queryOptions({ status: "pending", limit: 5 }),
	)
	const { data: collectionsList } = useQuery(
		trpc.collections.list.queryOptions(),
	)
	const { data: analytics } = useQuery(
		trpc.analytics.getDashboard.queryOptions({ days: 30 }),
	)
	const { data: aiUsage } = useQuery(
		trpc.ai.getUsageStats.queryOptions({ days: 30 }),
	)

	const totalEntries = entriesList?.length ?? 0
	const pendingComments = commentsList?.length ?? 0
	const viewsToday = analytics?.viewsToday ?? 0

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
					Dashboard
				</h1>
				<div className="flex gap-2">
					<Link
						to="/admin/collections"
						className="flex items-center gap-2 rounded-lg bg-[var(--foam)] px-3 py-2 text-sm font-medium text-[var(--sea-ink)] no-underline transition hover:bg-[var(--sand)]"
					>
						<Database size={16} />
						Collections
					</Link>
					<Link
						to="/admin/entries/new"
						className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-3 py-2 text-sm font-medium text-white no-underline transition hover:opacity-90"
					>
						<Plus size={16} />
						New Entry
					</Link>
				</div>
			</div>

			{/* Stats */}
			<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label="Total Entries"
					value={totalEntries}
					icon={FileText}
				/>
				<StatCard
					label="Page Views Today"
					value={viewsToday}
					icon={Eye}
					color="var(--palm)"
				/>
				<StatCard
					label="Pending Comments"
					value={pendingComments}
					icon={MessageSquare}
					color="#e67e22"
				/>
				<StatCard
					label="AI Tokens (30d)"
					value={
						(aiUsage?.period?.totalInput ?? 0) +
						(aiUsage?.period?.totalOutput ?? 0)
					}
					icon={Sparkles}
					color="#9b59b6"
				/>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Recent entries */}
				<div className="island-shell p-5">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
							Recent Entries
						</h2>
						<Link
							to="/admin/entries"
							className="text-sm text-[var(--lagoon)] no-underline hover:underline"
						>
							View all
						</Link>
					</div>
					{!entriesList?.length ? (
						<p className="text-sm text-[var(--sea-ink-soft)]">
							No entries yet.
						</p>
					) : (
						<ul className="flex flex-col gap-2">
							{entriesList.map((entry) => (
								<li key={entry.id}>
									<Link
										to="/admin/entries/$id"
										params={{ id: String(entry.id) }}
										className="flex items-center justify-between rounded-lg px-3 py-2 text-sm no-underline transition hover:bg-[var(--foam)]"
									>
										<span className="font-medium text-[var(--sea-ink)]">
											{entry.title}
										</span>
										<span
											className={`rounded-full px-2 py-0.5 text-xs font-medium ${
												entry.status === "published"
													? "bg-green-100 text-green-700"
													: entry.status === "draft"
														? "bg-yellow-100 text-yellow-700"
														: "bg-gray-100 text-gray-700"
											}`}
										>
											{entry.status}
										</span>
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>

				{/* Pending comments */}
				<div className="island-shell p-5">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
							Pending Comments
						</h2>
						<Link
							to="/admin/comments"
							className="text-sm text-[var(--lagoon)] no-underline hover:underline"
						>
							View all
						</Link>
					</div>
					{!commentsList?.length ? (
						<p className="text-sm text-[var(--sea-ink-soft)]">
							No pending comments.
						</p>
					) : (
						<ul className="flex flex-col gap-2">
							{commentsList.map((comment) => (
								<li
									key={comment.id}
									className="rounded-lg bg-[var(--foam)] px-3 py-2"
								>
									<div className="flex items-center gap-2 text-sm">
										<span className="font-medium text-[var(--sea-ink)]">
											{comment.authorName}
										</span>
										<span className="text-[var(--sea-ink-soft)]">
											on {comment.entry?.title ?? "Unknown"}
										</span>
									</div>
									<p className="mt-1 line-clamp-2 text-sm text-[var(--sea-ink-soft)]">
										{comment.content}
									</p>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	)
}
