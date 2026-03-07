import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

export const Route = createFileRoute("/admin/collections/$id")({
	component: CollectionDetailPage,
})

const FIELD_TYPES = [
	{ value: "text", label: "Text" },
	{ value: "richtext", label: "Rich Text" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "image", label: "Image" },
	{ value: "relation", label: "Relation" },
	{ value: "date", label: "Date" },
] as const

function CollectionDetailPage() {
	const { id } = Route.useParams()
	const navigate = useNavigate()
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: collection, isLoading } = useQuery(
		trpc.collections.getById.queryOptions({ id: Number(id) }),
	)

	const [editName, setEditName] = useState("")
	const [editDesc, setEditDesc] = useState("")
	const [isEditing, setIsEditing] = useState(false)

	const [newFieldName, setNewFieldName] = useState("")
	const [newFieldType, setNewFieldType] = useState<string>("text")
	const [newFieldRequired, setNewFieldRequired] = useState(false)
	const [showAddField, setShowAddField] = useState(false)

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.collections.getById.queryKey({ id: Number(id) }),
		})
	}

	const updateMutation = useMutation(
		trpc.collections.update.mutationOptions({
			onSuccess: () => {
				invalidate()
				setIsEditing(false)
			},
		}),
	)

	const addFieldMutation = useMutation(
		trpc.collections.addField.mutationOptions({
			onSuccess: () => {
				invalidate()
				setNewFieldName("")
				setNewFieldType("text")
				setNewFieldRequired(false)
				setShowAddField(false)
			},
		}),
	)

	const removeFieldMutation = useMutation(
		trpc.collections.removeField.mutationOptions({
			onSuccess: invalidate,
		}),
	)

	if (isLoading) {
		return (
			<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				Loading...
			</div>
		)
	}

	if (!collection) {
		return (
			<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				Collection not found
			</div>
		)
	}

	return (
		<div>
			<button
				type="button"
				onClick={() => navigate({ to: "/admin/collections" })}
				className="mb-4 flex items-center gap-1 text-sm text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
			>
				<ArrowLeft size={16} />
				Back to Collections
			</button>

			{/* Collection info */}
			<div className="island-shell mb-6 p-5">
				{isEditing ? (
					<form
						onSubmit={(e) => {
							e.preventDefault()
							updateMutation.mutate({
								id: collection.id,
								name: editName,
								description: editDesc || undefined,
							})
						}}
						className="flex flex-col gap-3"
					>
						<input
							type="text"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							className="rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-lg font-semibold text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
						/>
						<input
							type="text"
							value={editDesc}
							onChange={(e) => setEditDesc(e.target.value)}
							placeholder="Description"
							className="rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
						/>
						<div className="flex gap-2">
							<button
								type="submit"
								className="rounded-lg bg-[var(--lagoon)] px-3 py-1.5 text-sm font-medium text-white"
							>
								Save
							</button>
							<button
								type="button"
								onClick={() => setIsEditing(false)}
								className="rounded-lg bg-[var(--foam)] px-3 py-1.5 text-sm font-medium text-[var(--sea-ink)]"
							>
								Cancel
							</button>
						</div>
					</form>
				) : (
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
								{collection.name}
							</h1>
							<p className="text-sm text-[var(--sea-ink-soft)]">
								Slug: /{collection.slug}
							</p>
							{collection.description && (
								<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
									{collection.description}
								</p>
							)}
						</div>
						<button
							type="button"
							onClick={() => {
								setEditName(collection.name)
								setEditDesc(collection.description ?? "")
								setIsEditing(true)
							}}
							className="rounded-lg bg-[var(--foam)] px-3 py-1.5 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)]"
						>
							Edit
						</button>
					</div>
				)}
			</div>

			{/* Fields */}
			<div className="island-shell p-5">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
						Fields
					</h2>
					<button
						type="button"
						onClick={() => setShowAddField(!showAddField)}
						className="flex items-center gap-1 rounded-lg bg-[var(--lagoon)] px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
					>
						<Plus size={14} />
						Add Field
					</button>
				</div>

				{showAddField && (
					<form
						onSubmit={(e) => {
							e.preventDefault()
							addFieldMutation.mutate({
								collectionId: collection.id,
								name: newFieldName,
								type: newFieldType as "text",
								required: newFieldRequired,
							})
						}}
						className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-[var(--foam)] p-4"
					>
						<div className="flex-1">
							<label htmlFor="field-name" className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
								Name
							</label>
							<input
								id="field-name"
								type="text"
								value={newFieldName}
								onChange={(e) => setNewFieldName(e.target.value)}
								required
								placeholder="e.g. Title"
								className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
							/>
						</div>
						<div>
							<label htmlFor="field-type" className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">
								Type
							</label>
							<select
								id="field-type"
								value={newFieldType}
								onChange={(e) => setNewFieldType(e.target.value)}
								className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
							>
								{FIELD_TYPES.map((t) => (
									<option key={t.value} value={t.value}>
										{t.label}
									</option>
								))}
							</select>
						</div>
						<label className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
							<input
								type="checkbox"
								checked={newFieldRequired}
								onChange={(e) =>
									setNewFieldRequired(e.target.checked)
								}
								className="rounded"
							/>
							Required
						</label>
						<button
							type="submit"
							disabled={addFieldMutation.isPending}
							className="rounded-lg bg-[var(--lagoon)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
						>
							Add
						</button>
					</form>
				)}

				{!collection.fields?.length ? (
					<p className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">
						No fields yet. Add fields to define the structure of this
						collection.
					</p>
				) : (
					<ul className="flex flex-col gap-1">
						{collection.fields.map((field) => (
							<li
								key={field.id}
								className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[var(--foam)]"
							>
								<GripVertical
									size={16}
									className="text-[var(--sea-ink-soft)] opacity-40"
								/>
								<div className="flex-1">
									<span className="font-medium text-[var(--sea-ink)]">
										{field.name}
									</span>
									<span className="ml-2 text-xs text-[var(--sea-ink-soft)]">
										({field.slug})
									</span>
								</div>
								<span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
									{field.type}
								</span>
								{field.required && (
									<span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
										required
									</span>
								)}
								<button
									type="button"
									onClick={() => {
										if (confirm(`Remove field "${field.name}"?`)) {
											removeFieldMutation.mutate({
												id: field.id,
											})
										}
									}}
									className="rounded-lg p-1 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600"
								>
									<Trash2 size={14} />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}
