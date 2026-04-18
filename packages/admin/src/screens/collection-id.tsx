import { ArrowLeft, Plus, Trash2, GripVertical, Pencil, Check, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useGearuAdmin } from "../context"
import Select from "../components/select"

const FIELD_TYPES = [
	{ value: "text", label: "Text" },
	{ value: "richtext", label: "Rich Text" },
	{ value: "number", label: "Number" },
	{ value: "boolean", label: "Boolean" },
	{ value: "image", label: "Image" },
	{ value: "relation", label: "Relation" },
	{ value: "date", label: "Date" },
] as const

export function CollectionId() {
	const { useTRPC, basePath, navigate, params } = useGearuAdmin()
	const id = params?.id ? Number(params.id) : NaN
	const trpc = useTRPC() as {
		collections: {
			getById: { queryOptions: (opts: { id: number }) => { queryKey: unknown[] } }
			update: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
			addField: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
			updateField: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
			removeField: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
		}
	}
	const queryClient = useQueryClient()
	const { data: collection, isLoading } = useQuery(trpc.collections.getById.queryOptions({ id }))
	const [editName, setEditName] = useState("")
	const [editDesc, setEditDesc] = useState("")
	const [isEditing, setIsEditing] = useState(false)
	const [newFieldName, setNewFieldName] = useState("")
	const [newFieldType, setNewFieldType] = useState<string>("text")
	const [newFieldRequired, setNewFieldRequired] = useState(false)
	const [showAddField, setShowAddField] = useState(false)
	const [editingFieldId, setEditingFieldId] = useState<number | null>(null)
	const [editFieldName, setEditFieldName] = useState("")
	const [editFieldType, setEditFieldType] = useState("text")
	const [editFieldRequired, setEditFieldRequired] = useState(false)

	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: trpc.collections.getById.queryKey({ id }) })
	}
	const updateMutation = useMutation(
		trpc.collections.update.mutationOptions({ onSuccess: () => { invalidate(); setIsEditing(false) } }),
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
	const updateFieldMutation = useMutation(
		trpc.collections.updateField.mutationOptions({
			onSuccess: () => { invalidate(); setEditingFieldId(null) },
		}),
	)
	const removeFieldMutation = useMutation(trpc.collections.removeField.mutationOptions({ onSuccess: invalidate }))

	const startEditField = (field: { id: number; name: string; type: string; required: boolean | null }) => {
		setEditingFieldId(field.id)
		setEditFieldName(field.name)
		setEditFieldType(field.type)
		setEditFieldRequired(field.required ?? false)
	}

	if (isLoading) {
		return <div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">Loading...</div>
	}
	if (!collection) {
		return <div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">Collection not found</div>
	}

	const col = collection as { id: number; name: string; slug: string; description?: string; fields?: { id: number; name: string; slug: string; type: string; required: boolean | null }[] }

	return (
		<div>
			<button
				type="button"
				onClick={() => navigate(`${basePath}/collections`)}
				className="mb-4 flex items-center gap-1 text-sm text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
			>
				<ArrowLeft size={16} />
				Back to Collections
			</button>
			<div className="island-shell mb-6 p-5">
				{isEditing ? (
					<form
						onSubmit={(e) => {
							e.preventDefault()
							updateMutation.mutate({ id: col.id, name: editName, description: editDesc || undefined })
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
							<button type="submit" className="btn-primary">Save</button>
							<button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
						</div>
					</form>
				) : (
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-2xl font-bold text-[var(--sea-ink)]">{col.name}</h1>
							<p className="text-sm text-[var(--sea-ink-soft)]">Slug: /{col.slug}</p>
							{col.description && <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{col.description}</p>}
						</div>
						<button
							type="button"
							onClick={() => { setEditName(col.name); setEditDesc(col.description ?? ""); setIsEditing(true) }}
							className="rounded-lg bg-[var(--foam)] px-3 py-1.5 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)]"
						>
							Edit
						</button>
					</div>
				)}
			</div>
			<div className="island-shell p-5">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-[var(--sea-ink)]">Fields</h2>
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
								collectionId: col.id,
								name: newFieldName,
								type: newFieldType as "text",
								required: newFieldRequired,
							})
						}}
						className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-[var(--foam)] p-4"
					>
						<div className="flex-1">
							<label htmlFor="field-name" className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">Name</label>
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
						<div className="min-w-[160px]">
							<label htmlFor="field-type" className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">Type</label>
							<Select
								id="field-type"
								value={newFieldType}
								onChange={(val) => setNewFieldType(val)}
								options={FIELD_TYPES.map((t) => ({ value: t.value, label: t.label }))}
								isSearchable={false}
								size="sm"
							/>
						</div>
						<label className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
							<input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} className="rounded" />
							Required
						</label>
						<button type="submit" disabled={addFieldMutation.isPending} className="btn-primary">Add</button>
					</form>
				)}
				{!col.fields?.length ? (
					<p className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">No fields yet. Add fields to define the structure of this collection.</p>
				) : (
					<ul className="flex flex-col gap-1">
						{col.fields.map((field) => (
							<li key={field.id} className="rounded-lg border border-transparent transition hover:border-[var(--line)] hover:bg-[var(--foam)]">
								{editingFieldId === field.id ? (
									<form
										onSubmit={(e) => {
											e.preventDefault()
											updateFieldMutation.mutate({ id: field.id, name: editFieldName, type: editFieldType as "text", required: editFieldRequired } as any)
										}}
										className="flex flex-wrap items-end gap-3 p-3"
									>
										<div className="flex-1 min-w-[140px]">
											<label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">Name</label>
											<input
												type="text"
												value={editFieldName}
												onChange={(e) => setEditFieldName(e.target.value)}
												required
												autoFocus
												className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
											/>
										</div>
										<div className="min-w-[140px]">
											<label className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">Type</label>
											<Select
												value={editFieldType}
												onChange={(val) => setEditFieldType(val)}
												options={FIELD_TYPES.map((t) => ({ value: t.value, label: t.label }))}
												isSearchable={false}
												size="sm"
											/>
										</div>
										<label className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)] pb-1">
											<input type="checkbox" checked={editFieldRequired} onChange={(e) => setEditFieldRequired(e.target.checked)} className="rounded" />
											Required
										</label>
										<div className="flex gap-2 pb-0.5">
											<button type="submit" disabled={updateFieldMutation.isPending} className="flex items-center gap-1 rounded-lg bg-[var(--lagoon)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90">
												<Check size={13} />
												Save
											</button>
											<button type="button" onClick={() => setEditingFieldId(null)} className="flex items-center gap-1 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)] transition hover:bg-white">
												<X size={13} />
												Cancel
											</button>
										</div>
									</form>
								) : (
									<div className="flex items-center gap-3 px-3 py-2.5">
										<GripVertical size={16} className="text-[var(--sea-ink-soft)] opacity-40 shrink-0" />
										<div className="flex-1 min-w-0">
											<span className="font-medium text-[var(--sea-ink)]">{field.name}</span>
											<span className="ml-2 text-xs text-[var(--sea-ink-soft)]">({field.slug})</span>
										</div>
										<span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)] shrink-0">{field.type}</span>
										{field.required && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 shrink-0">required</span>}
										<button
											type="button"
											onClick={() => startEditField(field)}
											className="rounded-lg p-1 text-[var(--sea-ink-soft)] transition hover:bg-[var(--sand)] hover:text-[var(--sea-ink)]"
											title="Edit field"
										>
											<Pencil size={14} />
										</button>
										<button
											type="button"
											onClick={() => {
												if (confirm(`Remove field "${field.name}"?`)) removeFieldMutation.mutate({ id: field.id })
											}}
											className="rounded-lg p-1 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600"
											title="Delete field"
										>
											<Trash2 size={14} />
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}
