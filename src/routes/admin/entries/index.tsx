import { createFileRoute, Link } from "@tanstack/react-router"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

export const Route = createFileRoute("/admin/entries/")({
	component: EntriesPage,
})

function EntriesPage() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const [filterCollection, setFilterCollection] = useState<number | undefined>()
	const [filterStatus, setFilterStatus] = useState<string | undefined>()

	const { data: collections } = useQuery(
		trpc.collections.list.queryOptions(),
	)

	const { data: entriesList, isLoading } = useQuery(
		trpc.entries.list.queryOptions({
			collectionId: filterCollection,
			status: filterStatus as "draft" | "published" | "archived" | undefined,
			limit: 100,
		}),
	)

	const deleteMutation = useMutation(
		trpc.entries.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.entries.list.queryKey(),
				})
			},
		}),
	)

	const statusTabs = [
		{ value: undefined, label: "All" },
		{ value: "draft", label: "Draft" },
		{ value: "published", label: "Published" },
		{ value: "archived", label: "Archived" },
	]

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
					Entries
				</h1>
				<Link
					to="/admin/entries/new"
					className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-3 py-2 text-sm font-medium text-white no-underline transition hover:opacity-90"
				>
					<Plus size={16} />
					New Entry
				</Link>
			</div>

			{/* Filters */}
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="flex rounded-lg border border-[var(--line)] bg-[var(--sand)]">
					{statusTabs.map((tab) => (
						<button
							key={tab.label}
							type="button"
							onClick={() => setFilterStatus(tab.value)}
							className={`px-3 py-1.5 text-sm font-medium transition ${
								filterStatus === tab.value
									? "bg-[var(--lagoon)] text-white"
									: "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
							} first:rounded-l-lg last:rounded-r-lg`}
						>
							{tab.label}
						</button>
					))}
				</div>

				<select
					value={filterCollection ?? ""}
					onChange={(e) =>
						setFilterCollection(
							e.target.value ? Number(e.target.value) : undefined,
						)
					}
					className="rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-1.5 text-sm text-[var(--sea-ink)] outline-none"
				>
					<option value="">All Collections</option>
					{collections?.map((col) => (
						<option key={col.id} value={col.id}>
							{col.name}
						</option>
					))}
				</select>
			</div>

			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
					Loading...
				</div>
			) : !entriesList?.length ? (
				<div className="island-shell py-12 text-center">
					<p className="text-[var(--sea-ink-soft)]">
						No entries found.
					</p>
				</div>
			) : (
				<div className="island-shell overflow-hidden">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-[var(--line)] bg-[var(--foam)]">
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">
									Title
								</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">
									Collection
								</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">
									Status
								</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">
									Updated
								</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{entriesList.map((entry) => (
								<tr
									key={entry.id}
									className="border-b border-[var(--line)] last:border-0"
								>
									<td className="px-4 py-3">
										<Link
											to="/admin/entries/$id"
											params={{
												id: String(entry.id),
											}}
											className="font-medium text-[var(--sea-ink)] no-underline hover:text-[var(--lagoon)]"
										>
											{entry.title}
										</Link>
									</td>
									<td className="px-4 py-3 text-[var(--sea-ink-soft)]">
										{entry.collection?.name ?? "-"}
									</td>
									<td className="px-4 py-3">
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
									</td>
									<td className="px-4 py-3 text-[var(--sea-ink-soft)]">
										{entry.updatedAt
											? new Date(
													entry.updatedAt,
												).toLocaleDateString()
											: "-"}
									</td>
									<td className="px-4 py-3">
										<div className="flex gap-1">
											<Link
												to="/admin/entries/$id"
												params={{
													id: String(entry.id),
												}}
												className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]"
											>
												<Pencil size={14} />
											</Link>
											<button
												type="button"
												onClick={() => {
													if (
														confirm(
															`Delete "${entry.title}"?`,
														)
													) {
														deleteMutation.mutate({
															id: entry.id,
														})
													}
												}}
												className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600"
											>
												<Trash2 size={14} />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
