import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save, History, RotateCcw, ChevronDown, Search } from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, lazy, Suspense } from "react"
import SeoAnalyzer from "#/components/SeoAnalyzer"
import Select from "#/components/Select"

const TipTapEditor = lazy(() => import("#/components/TipTapEditor"))

export const Route = createFileRoute("/admin/entries/$id")({
	component: EntryDetailPage,
})

function EntryDetailPage() {
	const { id } = Route.useParams()
	const navigate = useNavigate()
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: entry, isLoading } = useQuery(
		trpc.entries.getById.queryOptions({ id: Number(id) }),
	)

	const { data: versions } = useQuery(
		trpc.entries.getVersions.queryOptions({ entryId: Number(id) }),
	)

	const [title, setTitle] = useState("")
	const [fieldValues, setFieldValues] = useState<
		Record<number, string | null>
	>({})
	const [status, setStatus] = useState<"draft" | "published" | "archived">(
		"draft",
	)
	const [metaTitle, setMetaTitle] = useState("")
	const [metaDescription, setMetaDescription] = useState("")
	const [ogImage, setOgImage] = useState("")
	const [showSeo, setShowSeo] = useState(false)
	const [showVersions, setShowVersions] = useState(false)

	useEffect(() => {
		if (entry) {
			setTitle(entry.title)
			setStatus(entry.status as "draft" | "published" | "archived")
			setMetaTitle(entry.metaTitle ?? "")
			setMetaDescription(entry.metaDescription ?? "")
			setOgImage(entry.ogImage ?? "")
			const values: Record<number, string | null> = {}
			for (const ef of entry.fields ?? []) {
				values[ef.fieldId] = ef.value
			}
			setFieldValues(values)
		}
	}, [entry])

	const invalidate = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.entries.getById.queryKey({ id: Number(id) }),
		})
		queryClient.invalidateQueries({
			queryKey: trpc.entries.getVersions.queryKey({ entryId: Number(id) }),
		})
	}

	const updateMutation = useMutation(
		trpc.entries.update.mutationOptions({
			onSuccess: invalidate,
		}),
	)

	const updateStatusMutation = useMutation(
		trpc.entries.updateStatus.mutationOptions({
			onSuccess: invalidate,
		}),
	)

	const restoreVersionMutation = useMutation(
		trpc.entries.restoreVersion.mutationOptions({
			onSuccess: invalidate,
		}),
	)

	const handleSave = () => {
		const collectionFields = entry?.collection?.fields ?? []
		const fields = collectionFields.map((cf) => ({
			fieldId: cf.id,
			value: fieldValues[cf.id] ?? null,
		}))
		updateMutation.mutate({
			id: Number(id),
			title,
			metaTitle: metaTitle || null,
			metaDescription: metaDescription || null,
			ogImage: ogImage || null,
			fields,
		})
	}

	const handleStatusChange = (newStatus: "draft" | "published" | "archived") => {
		setStatus(newStatus)
		updateStatusMutation.mutate({
			id: Number(id),
			status: newStatus,
		})
	}

	const handleRestore = (versionId: number) => {
		if (confirm("Restore this version? Current unsaved changes will be lost.")) {
			restoreVersionMutation.mutate({
				entryId: Number(id),
				versionId,
			})
		}
	}

	const setFieldValue = (fieldId: number, value: string | null) => {
		setFieldValues((prev) => ({ ...prev, [fieldId]: value }))
	}

	const renderField = (field: {
		id: number
		name: string
		slug: string
		type: string
		required: boolean | null
	}) => {
		const value = fieldValues[field.id] ?? ""
		const inputClass =
			"w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"

		switch (field.type) {
			case "richtext":
				return (
					<Suspense
						fallback={
							<div className={`${inputClass} min-h-[150px] animate-pulse`} />
						}
					>
						<TipTapEditor
							content={value}
							onChange={(html) => setFieldValue(field.id, html)}
							placeholder={`Enter ${field.name.toLowerCase()}`}
						/>
					</Suspense>
				)
			case "number":
				return (
					<input
						type="number"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						className={inputClass}
					/>
				)
			case "boolean":
				return (
					<label className="flex items-center gap-2 text-sm text-[var(--sea-ink)]">
						<input
							type="checkbox"
							checked={value === "true"}
							onChange={(e) =>
								setFieldValue(
									field.id,
									e.target.checked ? "true" : "false",
								)
							}
							className="h-4 w-4 rounded border-[var(--line)] accent-[var(--lagoon)]"
						/>
						{field.name}
					</label>
				)
			case "image":
				return (
					<input
						type="text"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						placeholder="Image URL"
						className={inputClass}
					/>
				)
			case "date":
				return (
					<input
						type="date"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						className={inputClass}
					/>
				)
			case "relation":
				return (
					<input
						type="text"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						placeholder="Related entry ID"
						className={inputClass}
					/>
				)
			default:
				return (
					<input
						type="text"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						className={inputClass}
					/>
				)
		}
	}

	if (isLoading) {
		return (
			<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				Loading...
			</div>
		)
	}

	if (!entry) {
		return (
			<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				Entry not found
			</div>
		)
	}

	const collectionFields = entry.collection?.fields ?? []

	return (
		<div>
			<button
				type="button"
				onClick={() => navigate({ to: "/admin/entries" })}
				className="mb-4 flex items-center gap-1 text-sm text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
			>
				<ArrowLeft size={16} />
				Back to Entries
			</button>

			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
						Edit Entry
					</h1>
					<p className="text-sm text-[var(--sea-ink-soft)]">
						Slug: /{entry.slug}
					</p>
				</div>
				<button
					type="button"
					onClick={handleSave}
					disabled={updateMutation.isPending}
					className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
				>
					<Save size={16} />
					{updateMutation.isPending ? "Saving..." : "Save"}
				</button>
			</div>

			{/* Title and Status */}
			<div className="island-shell mb-6 p-5">
				<div className="flex flex-col gap-4">
					<div>
						<label
							htmlFor="entry-title"
							className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]"
						>
							Title
						</label>
						<input
							id="entry-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-lg font-semibold text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
						/>
					</div>

					<div>
						<label
							htmlFor="entry-status"
							className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]"
						>
							Status
						</label>
						<div className="max-w-xs">
							<Select
								id="entry-status"
								value={status}
								onChange={(val) =>
									handleStatusChange(
										val as "draft" | "published" | "archived",
									)
								}
								options={[
									{ value: "draft", label: "Draft" },
									{ value: "published", label: "Published" },
									{ value: "archived", label: "Archived" },
								]}
								isSearchable={false}
							/>
						</div>
						{updateStatusMutation.isPending && (
							<span className="mt-1 block text-xs text-[var(--sea-ink-soft)]">
								Updating...
							</span>
						)}
					</div>

					<div>
						<span className="text-xs font-medium text-[var(--sea-ink-soft)]">
							Slug
						</span>
						<p className="text-sm text-[var(--sea-ink)]">
							/{entry.slug}
						</p>
					</div>
				</div>
			</div>

			{/* Dynamic Fields */}
			<div className="island-shell mb-6 p-5">
				<h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
					Fields
				</h2>
				{collectionFields.length === 0 ? (
					<p className="py-4 text-center text-sm text-[var(--sea-ink-soft)]">
						No fields defined for this collection.
					</p>
				) : (
					<div className="flex flex-col gap-4">
						{collectionFields.map((field) => (
							<div key={field.id}>
								{field.type !== "boolean" && (
									<label
										htmlFor={`field-${field.id}`}
										className="mb-1 flex items-center gap-1 text-xs font-medium text-[var(--sea-ink-soft)]"
									>
										{field.name}
										{field.required && (
											<span className="text-red-500">*</span>
										)}
										<span className="ml-1 rounded-full bg-[var(--foam)] px-1.5 py-0.5 text-[10px] text-[var(--sea-ink-soft)]">
											{field.type}
										</span>
									</label>
								)}
								{renderField(field)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* SEO Settings */}
			<div className="island-shell p-5">
				<button
					type="button"
					onClick={() => setShowSeo(!showSeo)}
					className="flex w-full items-center justify-between text-left"
				>
					<h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--sea-ink)]">
						<Search size={18} className="text-[var(--lagoon)]" />
						SEO Settings
					</h2>
					<ChevronDown
						size={18}
						className={`text-[var(--sea-ink-soft)] transition ${showSeo ? "rotate-180" : ""}`}
					/>
				</button>

				{showSeo && (
					<div className="mt-4 flex flex-col gap-4">
						<div>
							<label
								htmlFor="meta-title"
								className="mb-1 flex items-center justify-between text-xs font-medium text-[var(--sea-ink-soft)]"
							>
								Meta Title
								<span className={metaTitle.length > 60 ? "text-red-500" : ""}>
									{metaTitle.length}/60
								</span>
							</label>
							<input
								id="meta-title"
								type="text"
								value={metaTitle}
								onChange={(e) => setMetaTitle(e.target.value)}
								placeholder={title || "Defaults to entry title"}
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
							/>
						</div>
						<div>
							<label
								htmlFor="meta-description"
								className="mb-1 flex items-center justify-between text-xs font-medium text-[var(--sea-ink-soft)]"
							>
								Meta Description
								<span
									className={
										metaDescription.length > 160
											? "text-red-500"
											: ""
									}
								>
									{metaDescription.length}/160
								</span>
							</label>
							<textarea
								id="meta-description"
								value={metaDescription}
								onChange={(e) =>
									setMetaDescription(e.target.value)
								}
								placeholder="Auto-generated from content if empty"
								rows={3}
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] resize-y"
							/>
						</div>
						<div>
							<label
								htmlFor="og-image"
								className="mb-1 block text-xs font-medium text-[var(--sea-ink-soft)]"
							>
								OG Image URL
							</label>
							<input
								id="og-image"
								type="text"
								value={ogImage}
								onChange={(e) => setOgImage(e.target.value)}
								placeholder="Auto-generated if empty"
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
							/>
						</div>

						{/* Google Preview */}
						<div className="rounded-lg border border-[var(--line)] bg-white p-4">
							<p className="mb-1 text-xs text-[var(--sea-ink-soft)]">
								Search preview
							</p>
							<p className="text-[#1a0dab] text-lg leading-tight">
								{metaTitle || title || "Page Title"}
							</p>
							<p className="text-sm text-[#006621]">
								example.com/{entry.collection?.slug ?? "..."}/{entry.slug}
							</p>
							<p className="text-sm text-[#545454] line-clamp-2">
								{metaDescription || "Meta description will be auto-generated from content..."}
							</p>
						</div>
					</div>
				)}
			</div>

			{/* SEO Analyzer */}
			<SeoAnalyzer
				title={metaTitle || title}
				metaDescription={metaDescription}
				content={Object.values(fieldValues).filter(Boolean).join(" ")}
				slug={entry.slug}
				hasImage={
					!!ogImage ||
					Object.values(fieldValues).some(
						(v) => v && /<img|\.jpg|\.png|\.webp/i.test(v),
					)
				}
			/>

			{/* Version History */}
			<div className="island-shell p-5">
				<button
					type="button"
					onClick={() => setShowVersions(!showVersions)}
					className="flex w-full items-center justify-between text-left"
				>
					<div className="flex items-center gap-2">
						<History size={18} className="text-[var(--sea-ink-soft)]" />
						<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
							Version History
						</h2>
					</div>
					<span className="text-sm text-[var(--sea-ink-soft)]">
						{showVersions ? "Hide" : "Show"}
					</span>
				</button>

				{showVersions && (
					<div className="mt-4">
						{!versions?.length ? (
							<p className="py-4 text-center text-sm text-[var(--sea-ink-soft)]">
								No versions yet.
							</p>
						) : (
							<ul className="flex flex-col gap-2">
								{versions.map((version) => (
									<li
										key={version.id}
										className="flex items-center justify-between rounded-lg border border-[var(--line)] px-4 py-3"
									>
										<div>
											<span className="font-medium text-[var(--sea-ink)]">
												Version {version.versionNumber}
											</span>
											<span className="ml-3 text-xs text-[var(--sea-ink-soft)]">
												{version.createdAt
													? new Date(version.createdAt).toLocaleString()
													: ""}
											</span>
										</div>
										<button
											type="button"
											onClick={() => handleRestore(version.id)}
											disabled={restoreVersionMutation.isPending}
											className="flex items-center gap-1 rounded-lg bg-[var(--foam)] px-3 py-1.5 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)] disabled:opacity-50"
										>
											<RotateCcw size={14} />
											Restore
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
