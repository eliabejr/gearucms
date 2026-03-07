import { createFileRoute, Link } from "@tanstack/react-router"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

export const Route = createFileRoute("/admin/collections/")({
	component: CollectionsPage,
})

function CollectionsPage() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()
	const { data: collections, isLoading } = useQuery(
		trpc.collections.list.queryOptions(),
	)

	const [showCreate, setShowCreate] = useState(false)
	const [newName, setNewName] = useState("")
	const [newDescription, setNewDescription] = useState("")

	const createMutation = useMutation(
		trpc.collections.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.collections.list.queryKey() })
				setShowCreate(false)
				setNewName("")
				setNewDescription("")
			},
		}),
	)

	const deleteMutation = useMutation(
		trpc.collections.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.collections.list.queryKey() })
			},
		}),
	)

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
					Collections
				</h1>
				<button
					type="button"
					onClick={() => setShowCreate(!showCreate)}
					className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
				>
					<Plus size={16} />
					New Collection
				</button>
			</div>

			{showCreate && (
				<div className="island-shell mb-6 p-5">
					<h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
						Create Collection
					</h2>
					<form
						onSubmit={(e) => {
							e.preventDefault()
							createMutation.mutate({
								name: newName,
								description: newDescription || undefined,
							})
						}}
						className="flex flex-col gap-3"
					>
						<div>
							<label htmlFor="col-name" className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]">
								Name
							</label>
							<input
								id="col-name"
								type="text"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								required
								placeholder="e.g. Blog Posts"
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
							/>
						</div>
						<div>
							<label htmlFor="col-desc" className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]">
								Description
							</label>
							<input
								id="col-desc"
								type="text"
								value={newDescription}
								onChange={(e) => setNewDescription(e.target.value)}
								placeholder="Optional description"
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
							/>
						</div>
						<div className="flex gap-2">
							<button
								type="submit"
								disabled={createMutation.isPending}
								className="rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
							>
								{createMutation.isPending ? "Creating..." : "Create"}
							</button>
							<button
								type="button"
								onClick={() => setShowCreate(false)}
								className="rounded-lg bg-[var(--foam)] px-4 py-2 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)]"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
					Loading...
				</div>
			) : !collections?.length ? (
				<div className="island-shell py-12 text-center">
					<p className="text-[var(--sea-ink-soft)]">
						No collections yet. Create your first one!
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{collections.map((col) => (
						<div key={col.id} className="island-shell p-5">
							<div className="mb-3 flex items-start justify-between">
								<div>
									<h3 className="text-lg font-semibold text-[var(--sea-ink)]">
										{col.name}
									</h3>
									<p className="text-xs text-[var(--sea-ink-soft)]">
										/{col.slug}
									</p>
								</div>
								<div className="flex gap-1">
									<Link
										to="/admin/collections/$id"
										params={{ id: String(col.id) }}
										className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]"
									>
										<Pencil size={16} />
									</Link>
									<button
										type="button"
										onClick={() => {
											if (confirm(`Delete "${col.name}"? This will also delete all its entries.`)) {
												deleteMutation.mutate({ id: col.id })
											}
										}}
										className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
							{col.description && (
								<p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
									{col.description}
								</p>
							)}
							<div className="flex gap-4 text-xs text-[var(--sea-ink-soft)]">
								<span>{col.fields?.length ?? 0} fields</span>
								<span>{col.entries?.length ?? 0} entries</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
