import { createFileRoute } from "@tanstack/react-router"
import { Plus, Pencil, Trash2, Code, ToggleLeft, ToggleRight } from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

export const Route = createFileRoute("/admin/settings")({
	component: SettingsPage,
})

const locationLabels: Record<string, string> = {
	head: "Head",
	body_start: "Body Start",
	body_end: "Body End",
}

function SettingsPage() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: scripts, isLoading } = useQuery(
		trpc.settings.listScripts.queryOptions(),
	)

	const [showCreate, setShowCreate] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [formName, setFormName] = useState("")
	const [formLocation, setFormLocation] = useState<"head" | "body_start" | "body_end">("head")
	const [formScript, setFormScript] = useState("")
	const [formActive, setFormActive] = useState(true)

	const invalidateScripts = () => {
		queryClient.invalidateQueries({ queryKey: trpc.settings.listScripts.queryKey() })
	}

	const createMutation = useMutation(
		trpc.settings.createScript.mutationOptions({
			onSuccess: () => {
				invalidateScripts()
				resetForm()
			},
		}),
	)

	const updateMutation = useMutation(
		trpc.settings.updateScript.mutationOptions({
			onSuccess: () => {
				invalidateScripts()
				resetForm()
			},
		}),
	)

	const deleteMutation = useMutation(
		trpc.settings.deleteScript.mutationOptions({
			onSuccess: invalidateScripts,
		}),
	)

	const toggleMutation = useMutation(
		trpc.settings.updateScript.mutationOptions({
			onSuccess: invalidateScripts,
		}),
	)

	const resetForm = () => {
		setShowCreate(false)
		setEditingId(null)
		setFormName("")
		setFormLocation("head")
		setFormScript("")
		setFormActive(true)
	}

	const startEdit = (script: {
		id: number
		name: string
		location: string
		script: string
		active: boolean | null
	}) => {
		setEditingId(script.id)
		setFormName(script.name)
		setFormLocation(script.location as "head" | "body_start" | "body_end")
		setFormScript(script.script)
		setFormActive(script.active ?? true)
		setShowCreate(true)
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (editingId) {
			updateMutation.mutate({
				id: editingId,
				name: formName,
				location: formLocation,
				script: formScript,
				active: formActive,
			})
		} else {
			createMutation.mutate({
				name: formName,
				location: formLocation,
				script: formScript,
				active: formActive,
			})
		}
	}

	const isSaving = createMutation.isPending || updateMutation.isPending

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
					Settings
				</h1>
				<button
					type="button"
					onClick={() => {
						if (showCreate) {
							resetForm()
						} else {
							resetForm()
							setShowCreate(true)
						}
					}}
					className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
				>
					<Plus size={16} />
					Add Script
				</button>
			</div>

			{/* Create/Edit form */}
			{showCreate && (
				<div className="island-shell mb-6 p-5">
					<h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
						{editingId ? "Edit Script" : "Add Tracking Script"}
					</h2>
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label
									htmlFor="script-name"
									className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]"
								>
									Name
								</label>
								<input
									id="script-name"
									type="text"
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									required
									placeholder="e.g. Google Analytics"
									className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
								/>
							</div>
							<div>
								<label
									htmlFor="script-location"
									className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]"
								>
									Location
								</label>
								<select
									id="script-location"
									value={formLocation}
									onChange={(e) =>
										setFormLocation(
											e.target.value as "head" | "body_start" | "body_end",
										)
									}
									className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
								>
									<option value="head">Head</option>
									<option value="body_start">Body Start</option>
									<option value="body_end">Body End</option>
								</select>
							</div>
						</div>

						<div>
							<label
								htmlFor="script-code"
								className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]"
							>
								Script
							</label>
							<textarea
								id="script-code"
								value={formScript}
								onChange={(e) => setFormScript(e.target.value)}
								required
								rows={6}
								placeholder="<script>...</script>"
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 font-mono text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
							/>
						</div>

						<label className="flex items-center gap-2 text-sm text-[var(--sea-ink)]">
							<input
								type="checkbox"
								checked={formActive}
								onChange={(e) => setFormActive(e.target.checked)}
								className="rounded border-[var(--line)]"
							/>
							Active
						</label>

						<div className="flex gap-2">
							<button
								type="submit"
								disabled={isSaving}
								className="rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
							>
								{isSaving
									? "Saving..."
									: editingId
										? "Update Script"
										: "Create Script"}
							</button>
							<button
								type="button"
								onClick={resetForm}
								className="rounded-lg bg-[var(--foam)] px-4 py-2 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)]"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Scripts list */}
			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
					Loading...
				</div>
			) : !scripts?.length ? (
				<div className="island-shell py-12 text-center">
					<div className="flex flex-col items-center gap-2">
						<Code size={32} className="text-[var(--sea-ink-soft)]" />
						<p className="text-[var(--sea-ink-soft)]">
							No tracking scripts yet.
						</p>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{scripts.map((script) => (
						<div key={script.id} className="island-shell p-5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<button
										type="button"
										onClick={() =>
											toggleMutation.mutate({
												id: script.id,
												active: !(script.active ?? true),
											})
										}
										className="text-[var(--sea-ink-soft)] transition hover:text-[var(--lagoon)]"
										title={script.active ? "Deactivate" : "Activate"}
									>
										{script.active ? (
											<ToggleRight
												size={24}
												className="text-[var(--lagoon)]"
											/>
										) : (
											<ToggleLeft size={24} />
										)}
									</button>
									<div>
										<h3 className="font-medium text-[var(--sea-ink)]">
											{script.name}
										</h3>
										<span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
											{locationLabels[script.location] ?? script.location}
										</span>
									</div>
								</div>

								<div className="flex gap-1">
									<button
										type="button"
										onClick={() => startEdit(script)}
										className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]"
										title="Edit"
									>
										<Pencil size={16} />
									</button>
									<button
										type="button"
										onClick={() => {
											if (
												confirm(
													`Delete "${script.name}"?`,
												)
											) {
												deleteMutation.mutate({
													id: script.id,
												})
											}
										}}
										className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600"
										title="Delete"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
