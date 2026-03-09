/**
 * Leads admin page. Renders inside the host app's admin layout.
 * Requires the host to merge createLeadsRouter() into the app tRPC router under "leads".
 */
import {
	Plus,
	Trash2,
	UserPlus,
	ClipboardList,
	Tag,
	Mail,
	X,
	Pencil,
	Download,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query"
import { useState } from "react"
import { useGearuAdmin, Select } from "@gearu/admin"

type LeadsTab = "leads" | "forms"

const FIELD_TYPES = [
	{ value: "text", label: "Text" },
	{ value: "email", label: "Email" },
	{ value: "phone", label: "Phone" },
	{ value: "textarea", label: "Textarea" },
	{ value: "select", label: "Select" },
	{ value: "number", label: "Number" },
	{ value: "url", label: "URL" },
] as const

type FormField = {
	name: string
	label: string
	type: string
	required: boolean
	placeholder?: string
	options?: string
}

type LeadForm = {
	id: number
	name: string
	slug: string
	tag: string
	fields: FormField[]
}

type Lead = {
	id: number
	name: string
	email: string
	form?: { name: string } | null
	formTag?: string | null
	utmSource?: string | null
	utmMedium?: string | null
	utmCampaign?: string | null
	referrer?: string | null
	createdAt?: string | number | Date | null
}

export function LeadsPage() {
	const [activeTab, setActiveTab] = useState<LeadsTab>("leads")

	const tabs: { id: LeadsTab; label: string; icon: React.ReactNode }[] = [
		{ id: "leads", label: "Leads", icon: <UserPlus size={16} /> },
		{ id: "forms", label: "Forms", icon: <ClipboardList size={16} /> },
	]

	return (
		<div>
			<h1 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">Leads</h1>

			<div className="mb-6 flex gap-1 border-b border-[var(--line)]">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						className={`flex items-center gap-2 rounded-t-md px-4 py-2.5 text-sm font-medium transition ${
							activeTab === tab.id
								? "border-b-2 border-[var(--lagoon)] text-[var(--sea-ink)]"
								: "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			{activeTab === "leads" && <LeadsTab />}
			{activeTab === "forms" && <FormsTab />}
		</div>
	)
}

function LeadsTab() {
	const { useTRPC } = useGearuAdmin()
	const trpc = useTRPC() as {
		leads: {
			listForms: { queryOptions: () => { queryKey: unknown[] } }
			listLeads: {
				queryOptions: (opts: { formId?: number; tag?: string; limit: number }) => { queryKey: unknown[] }
				queryKey: () => unknown[]
			}
			deleteLead: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
		}
	}
	const queryClient = useQueryClient()
	const [filterFormId, setFilterFormId] = useState<number | undefined>()
	const [filterTag, setFilterTag] = useState<string | undefined>()

	const { data: forms } = useQuery(trpc.leads.listForms.queryOptions()) as { data?: LeadForm[] }

	const { data: leadsList, isLoading } = useQuery(
		trpc.leads.listLeads.queryOptions({
			formId: filterFormId,
			tag: filterTag,
			limit: 100,
		}),
	) as { data?: Lead[]; isLoading: boolean }

	const deleteMutation = useMutation(
		trpc.leads.deleteLead.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: trpc.leads.listLeads.queryKey() })
			},
		}) as UseMutationOptions<unknown, Error, { id: number }, unknown>,
	)

	const uniqueTags = Array.from(
		new Set((forms ?? []).map((f) => f.tag).filter(Boolean)),
	) as string[]

	const handleExport = () => {
		if (!leadsList?.length) return
		const headers = ["Name", "Email", "Form", "Tag", "UTM Source", "UTM Medium", "UTM Campaign", "Date"]
		const rows = leadsList.map((lead) => [
			lead.name,
			lead.email,
			lead.form?.name ?? "-",
			lead.formTag ?? "-",
			lead.utmSource ?? "-",
			lead.utmMedium ?? "-",
			lead.utmCampaign ?? "-",
			lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "-",
		])
		const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
		const blob = new Blob([csv], { type: "text/csv" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div>
			<div className="mb-4 flex flex-wrap items-center gap-3">
					<div className="min-w-[200px]">
					<Select
						value={filterFormId?.toString() ?? ""}
						onChange={(val: string) => setFilterFormId(val ? Number(val) : undefined)}
						options={(forms ?? []).map((f) => ({ value: String(f.id), label: f.name }))}
						placeholder="All Forms"
						isClearable
						size="sm"
					/>
				</div>
				{uniqueTags.length > 0 && (
					<div className="min-w-[160px]">
						<Select
							value={filterTag ?? ""}
							onChange={(val: string) => setFilterTag(val || undefined)}
							options={uniqueTags.map((t) => ({ value: t, label: t }))}
							placeholder="All Tags"
							isClearable
							size="sm"
						/>
					</div>
				)}
				{(leadsList?.length ?? 0) > 0 && (
					<button
						type="button"
						onClick={handleExport}
						className="ml-auto flex items-center gap-2 rounded-lg bg-[var(--foam)] px-3 py-1.5 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)]"
					>
						<Download size={14} />
						Export CSV
					</button>
				)}
			</div>

			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">Loading...</div>
			) : !leadsList?.length ? (
				<div className="island-shell py-12 text-center">
					<div className="flex flex-col items-center gap-2">
						<UserPlus size={32} className="text-[var(--sea-ink-soft)]" />
						<p className="text-[var(--sea-ink-soft)]">No leads captured yet.</p>
					</div>
				</div>
			) : (
				<div className="island-shell overflow-hidden">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-[var(--line)] bg-[var(--foam)]">
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">Name</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">Email</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">Form</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">Tag</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">Source</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">Date</th>
								<th className="px-4 py-3 font-medium text-[var(--sea-ink-soft)]">Actions</th>
							</tr>
						</thead>
						<tbody>
							{leadsList.map((lead) => (
								<tr key={lead.id} className="border-b border-[var(--line)] last:border-0">
									<td className="px-4 py-3 font-medium text-[var(--sea-ink)]">{lead.name}</td>
									<td className="px-4 py-3 text-[var(--sea-ink)]">
										<span className="flex items-center gap-1">
											<Mail size={12} className="text-[var(--sea-ink-soft)]" />
											{lead.email}
										</span>
									</td>
									<td className="px-4 py-3 text-[var(--sea-ink-soft)]">{lead.form?.name ?? "-"}</td>
									<td className="px-4 py-3">
										{lead.formTag && (
											<span className="inline-flex items-center gap-1 rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
												<Tag size={10} />
												{lead.formTag}
											</span>
										)}
									</td>
									<td className="px-4 py-3 text-xs text-[var(--sea-ink-soft)]">
										{lead.utmSource
											? `${lead.utmSource}${lead.utmMedium ? ` / ${lead.utmMedium}` : ""}`
											: lead.referrer || "-"}
									</td>
									<td className="px-4 py-3 text-[var(--sea-ink-soft)]">
										{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "-"}
									</td>
									<td className="px-4 py-3">
										<button
											type="button"
											onClick={() => {
												if (confirm("Delete this lead?")) {
													deleteMutation.mutate({ id: lead.id })
												}
											}}
											className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600"
										>
											<Trash2 size={14} />
										</button>
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

function FormsTab() {
	const { useTRPC } = useGearuAdmin()
	const trpc = useTRPC() as {
		leads: {
			listForms: {
				queryOptions: () => { queryKey: unknown[] }
				queryKey: () => unknown[]
			}
			createForm: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
			updateForm: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
			deleteForm: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
		}
	}
	const queryClient = useQueryClient()

	const { data: forms, isLoading } = useQuery(trpc.leads.listForms.queryOptions()) as {
		data?: (LeadForm & { slug: string })[]
		isLoading: boolean
	}

	const [showCreate, setShowCreate] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [formName, setFormName] = useState("")
	const [formTag, setFormTag] = useState("")
	const [formFields, setFormFields] = useState<FormField[]>([])

	const invalidateForms = () => {
		queryClient.invalidateQueries({ queryKey: trpc.leads.listForms.queryKey() })
	}

	const createMutation = useMutation(
		trpc.leads.createForm.mutationOptions({
			onSuccess: () => {
				invalidateForms()
				resetForm()
			},
		}) as UseMutationOptions<unknown, Error, { name: string; tag: string; fields: FormField[] }, unknown>,
	)
	const updateMutation = useMutation(
		trpc.leads.updateForm.mutationOptions({
			onSuccess: () => {
				invalidateForms()
				resetForm()
			},
		}) as UseMutationOptions<unknown, Error, { id: number; name: string; tag: string; fields: FormField[] }, unknown>,
	)
	const deleteFormMutation = useMutation(
		trpc.leads.deleteForm.mutationOptions({
			onSuccess: invalidateForms,
		}) as UseMutationOptions<unknown, Error, { id: number }, unknown>,
	)

	const resetForm = () => {
		setShowCreate(false)
		setEditingId(null)
		setFormName("")
		setFormTag("")
		setFormFields([])
	}

	const startEdit = (form: LeadForm & { slug: string }) => {
		setEditingId(form.id)
		setFormName(form.name)
		setFormTag(form.tag)
		setFormFields(form.fields)
		setShowCreate(true)
	}

	const addField = () => {
		setFormFields([
			...formFields,
			{ name: "", label: "", type: "text", required: false, placeholder: "" },
		])
	}

	const updateField = (index: number, updates: Partial<FormField>) => {
		setFormFields((prev) =>
			prev.map((f, i) => {
				if (i !== index) return f
				const updated = { ...f, ...updates }
				if (updates.label !== undefined) {
					updated.name = updates.label
						.toLowerCase()
						.trim()
						.replace(/[^\w\s]/g, "")
						.replace(/\s+/g, "_")
				}
				return updated
			}),
		)
	}

	const removeField = (index: number) => {
		setFormFields((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (editingId) {
			updateMutation.mutate({ id: editingId, name: formName, tag: formTag, fields: formFields })
		} else {
			createMutation.mutate({ name: formName, tag: formTag, fields: formFields })
		}
	}

	const isSaving = createMutation.isPending || updateMutation.isPending

	return (
		<div>
			<div className="mb-4 flex items-center justify-end">
				<button
					type="button"
					onClick={() => {
						if (showCreate) resetForm()
						else {
							resetForm()
							setShowCreate(true)
						}
					}}
					className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
				>
					<Plus size={16} />
					New Form
				</button>
			</div>

			{showCreate && (
				<div className="island-shell mb-6 p-5">
					<h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
						{editingId ? "Edit Form" : "Create Lead Form"}
					</h2>
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="form-name" className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]">
									Form Name
								</label>
								<input
									id="form-name"
									type="text"
									value={formName}
									onChange={(e) => setFormName(e.target.value)}
									required
									placeholder="e.g. Newsletter Signup"
									className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
								/>
							</div>
							<div>
								<label htmlFor="form-tag" className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]">
									Tag
								</label>
								<input
									id="form-tag"
									type="text"
									value={formTag}
									onChange={(e) => setFormTag(e.target.value)}
									required
									placeholder="e.g. newsletter, waitlist, demo"
									className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
								/>
							</div>
						</div>

						<div className="rounded-lg bg-[var(--foam)] px-4 py-3">
							<p className="text-xs font-medium text-[var(--sea-ink-soft)]">
								Name and Email are always included as required fields. Add extra fields below.
							</p>
						</div>

						<div>
							<div className="mb-3 flex items-center justify-between">
								<span className="text-sm font-medium text-[var(--sea-ink)]">Additional Fields</span>
								<button
									type="button"
									onClick={addField}
									className="flex items-center gap-1 rounded-lg bg-[var(--foam)] px-2.5 py-1.5 text-xs font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)]"
								>
									<Plus size={12} />
									Add Field
								</button>
							</div>

							{formFields.length === 0 ? (
								<p className="py-4 text-center text-sm text-[var(--sea-ink-soft)]">
									No extra fields. Only name and email will be collected.
								</p>
							) : (
								<div className="flex flex-col gap-3">
									{formFields.map((field, index) => (
										<div
											key={field.label || field.name || `field-${index}`}
											className="flex flex-wrap items-end gap-3 rounded-lg bg-[var(--foam)] p-3"
										>
											<div className="min-w-[140px] flex-1">
												<label htmlFor={`field-label-${index}`} className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">Label</label>
												<input
													id={`field-label-${index}`}
													type="text"
													value={field.label}
													onChange={(e) => updateField(index, { label: e.target.value })}
													required
													placeholder="e.g. Company"
													className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
												/>
											</div>
											<div className="min-w-[120px]">
												<span className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">Type</span>
												<Select
													value={field.type}
													onChange={(val: string) => updateField(index, { type: val })}
													options={FIELD_TYPES.map((t) => ({ value: t.value, label: t.label }))}
													isSearchable={false}
													size="sm"
												/>
											</div>
											<div className="min-w-[140px] flex-1">
												<label htmlFor={`field-placeholder-${index}`} className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]">Placeholder</label>
												<input
													id={`field-placeholder-${index}`}
													type="text"
													value={field.placeholder ?? ""}
													onChange={(e) => updateField(index, { placeholder: e.target.value })}
													placeholder="Optional"
													className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
												/>
											</div>
											<label htmlFor={`field-required-${index}`} className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
												<input
													id={`field-required-${index}`}
													type="checkbox"
													checked={field.required}
													onChange={(e) => updateField(index, { required: e.target.checked })}
													className="rounded"
												/>
												Required
											</label>
											<button
												type="button"
												onClick={() => removeField(index)}
												className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600"
											>
												<X size={14} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="flex gap-2">
							<button
								type="submit"
								disabled={isSaving}
								className="rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
							>
								{isSaving ? "Saving..." : editingId ? "Update Form" : "Create Form"}
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

			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">Loading...</div>
			) : !forms?.length ? (
				<div className="island-shell py-12 text-center">
					<div className="flex flex-col items-center gap-2">
						<ClipboardList size={32} className="text-[var(--sea-ink-soft)]" />
						<p className="text-[var(--sea-ink-soft)]">No lead forms yet. Create your first one!</p>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{forms.map((form) => (
						<div key={form.id} className="island-shell p-5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div>
										<div className="flex items-center gap-2">
											<h3 className="font-medium text-[var(--sea-ink)]">{form.name}</h3>
											<span className="inline-flex items-center gap-1 rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
												<Tag size={10} />
												{form.tag}
											</span>
										</div>
										<div className="mt-1 flex items-center gap-3 text-xs text-[var(--sea-ink-soft)]">
											<span>/{form.slug}</span>
											<span>
												{form.fields.length} extra {form.fields.length === 1 ? "field" : "fields"}
											</span>
											<span>+ name & email (required)</span>
										</div>
									</div>
								</div>

								<div className="flex gap-1">
									<button
										type="button"
										onClick={() => startEdit(form)}
										className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]"
										title="Edit"
									>
										<Pencil size={16} />
									</button>
									<button
										type="button"
										onClick={() => {
											if (confirm(`Delete form "${form.name}"? This will also delete all its leads.`)) {
												deleteFormMutation.mutate({ id: form.id })
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
