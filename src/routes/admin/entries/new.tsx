import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save, FileText, ChevronDown, Search } from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useState, lazy, Suspense } from "react"
import SeoAnalyzer from "#/components/SeoAnalyzer"
import Select from "#/components/Select"

const TipTapEditor = lazy(() => import("#/components/TipTapEditor"))

export const Route = createFileRoute("/admin/entries/new")({
	component: NewEntryPage,
})

function NewEntryPage() {
	const navigate = useNavigate()
	const trpc = useTRPC()

	const [selectedCollectionId, setSelectedCollectionId] = useState<
		number | undefined
	>()
	const [title, setTitle] = useState("")
	const [slug, setSlug] = useState("")
	const [status, setStatus] = useState<"draft" | "published">("draft")
	const [metaTitle, setMetaTitle] = useState("")
	const [metaDescription, setMetaDescription] = useState("")
	const [ogImage, setOgImage] = useState("")
	const [showSeo, setShowSeo] = useState(false)
	const [fieldValues, setFieldValues] = useState<
		Record<number, string | null>
	>({})

	const { data: collections, isLoading: collectionsLoading } = useQuery(
		trpc.collections.list.queryOptions(),
	)

	const { data: collection, isLoading: collectionLoading } = useQuery(
		trpc.collections.getById.queryOptions(
			{ id: selectedCollectionId! },
			{ enabled: !!selectedCollectionId },
		),
	)

	const createMutation = useMutation(
		trpc.entries.create.mutationOptions({
			onSuccess: (entry) => {
				navigate({
					to: "/admin/entries/$id",
					params: { id: String(entry.id) },
				})
			},
		}),
	)

	const handleCollectionChange = (collectionId: number | undefined) => {
		setSelectedCollectionId(collectionId)
		setFieldValues({})
	}

	const setFieldValue = (fieldId: number, value: string | null) => {
		setFieldValues((prev) => ({ ...prev, [fieldId]: value }))
	}

	const slugify = (text: string) =>
		text
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_]+/g, "-")
			.replace(/-+/g, "-")

	const handleTitleChange = (value: string) => {
		setTitle(value)
		if (!slug || slug === slugify(title)) {
			setSlug(slugify(value))
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedCollectionId || !title.trim()) return

		const fields = collection?.fields
			? collection.fields.map((field) => ({
					fieldId: field.id,
					value: fieldValues[field.id] ?? null,
				}))
			: []

		createMutation.mutate({
			collectionId: selectedCollectionId,
			title: title.trim(),
			slug: slug || undefined,
			status,
			metaTitle: metaTitle || undefined,
			metaDescription: metaDescription || undefined,
			ogImage: ogImage || undefined,
			fields,
		})
	}

	const renderFieldInput = (field: {
		id: number
		name: string
		slug: string
		type: string
		required: boolean | null
	}) => {
		const value = fieldValues[field.id] ?? ""
		const inputClasses =
			"w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] transition"

		switch (field.type) {
			case "text":
				return (
					<input
						type="text"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						required={!!field.required}
						placeholder={`Enter ${field.name.toLowerCase()}`}
						className={inputClasses}
					/>
				)

			case "richtext":
				return (
					<Suspense
						fallback={
							<div className={`${inputClasses} min-h-[150px] animate-pulse`} />
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
						required={!!field.required}
						placeholder="0"
						className={inputClasses}
					/>
				)

			case "boolean":
				return (
					<label className="flex items-center gap-3 cursor-pointer">
						<button
							type="button"
							role="switch"
							aria-checked={value === "true"}
							onClick={() =>
								setFieldValue(
									field.id,
									value === "true" ? "false" : "true",
								)
							}
							className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
								value === "true"
									? "bg-[var(--lagoon)]"
									: "bg-[var(--line)]"
							}`}
						>
							<span
								className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
									value === "true"
										? "translate-x-6"
										: "translate-x-1"
								}`}
							/>
						</button>
						<span className="text-sm text-[var(--sea-ink-soft)]">
							{value === "true" ? "Yes" : "No"}
						</span>
					</label>
				)

			case "image":
				return (
					<input
						type="text"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						required={!!field.required}
						placeholder="Image URL (media picker coming soon)"
						className={inputClasses}
					/>
				)

			case "date":
				return (
					<input
						type="date"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						required={!!field.required}
						className={inputClasses}
					/>
				)

			case "relation":
				return (
					<input
						type="text"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						required={!!field.required}
						placeholder="Related entry ID"
						className={inputClasses}
					/>
				)

			default:
				return (
					<input
						type="text"
						value={value}
						onChange={(e) => setFieldValue(field.id, e.target.value)}
						required={!!field.required}
						placeholder={`Enter ${field.name.toLowerCase()}`}
						className={inputClasses}
					/>
				)
		}
	}

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

			<div className="mb-6 flex items-center gap-3">
				<FileText size={24} className="text-[var(--lagoon)]" />
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">
					New Entry
				</h1>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-6">
				{/* Collection & Status */}
				<div className="island-shell rounded-xl p-5">
					<h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
						General
					</h2>
					<div className="flex flex-col gap-4">
						<div>
							<label
								htmlFor="collection-select"
								className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
							>
								Collection
							</label>
							<Select
								id="collection-select"
								value={selectedCollectionId?.toString() ?? ""}
								onChange={(val) =>
									handleCollectionChange(
										val ? Number(val) : undefined,
									)
								}
								options={
									collectionsLoading
										? []
										: (collections ?? []).map((col) => ({
												value: String(col.id),
												label: col.name,
											}))
								}
								placeholder="Select a collection"
								isClearable
							/>
						</div>

						<div>
							<label
								htmlFor="entry-title"
								className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
							>
								Title
							</label>
							<input
								id="entry-title"
								type="text"
								value={title}
								onChange={(e) =>
									handleTitleChange(e.target.value)
								}
								required
								placeholder="Entry title"
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] transition"
							/>
						</div>

						<div>
							<label
								htmlFor="entry-slug"
								className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
							>
								Slug
							</label>
							<input
								id="entry-slug"
								type="text"
								value={slug}
								onChange={(e) => setSlug(e.target.value)}
								placeholder="auto-generated-from-title"
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] transition"
							/>
						</div>

						<div>
							<label
								htmlFor="entry-status"
								className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
							>
								Status
							</label>
							<div className="flex rounded-lg border border-[var(--line)] bg-[var(--sand)] w-fit">
								<button
									type="button"
									onClick={() => setStatus("draft")}
									className={`px-4 py-1.5 text-sm font-medium rounded-l-lg transition ${
										status === "draft"
											? "bg-yellow-100 text-yellow-700"
											: "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
									}`}
								>
									Draft
								</button>
								<button
									type="button"
									onClick={() => setStatus("published")}
									className={`px-4 py-1.5 text-sm font-medium rounded-r-lg transition ${
										status === "published"
											? "bg-green-100 text-green-700"
											: "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
									}`}
								>
									Published
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Dynamic Fields */}
				{selectedCollectionId && (
					<div className="island-shell rounded-xl p-5">
						<h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
							Fields
						</h2>

						{collectionLoading ? (
							<div className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">
								Loading fields...
							</div>
						) : !collection?.fields?.length ? (
							<div className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">
								This collection has no fields defined yet. Add
								fields in the collection settings.
							</div>
						) : (
							<div className="flex flex-col gap-5">
								{collection.fields.map((field) => (
									<div key={field.id}>
										<label
											htmlFor={`field-${field.id}`}
											className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--sea-ink)]"
										>
											{field.name}
											{field.required && (
												<span className="text-xs text-red-500">
													*
												</span>
											)}
											<span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-normal text-[var(--sea-ink-soft)]">
												{field.type}
											</span>
										</label>
										{renderFieldInput(field)}
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* SEO Settings */}
				<div className="island-shell rounded-xl p-5">
					<button
						type="button"
						onClick={() => setShowSeo(!showSeo)}
						className="flex w-full items-center justify-between text-left"
					>
						<h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
							<Search size={16} className="text-[var(--lagoon)]" />
							SEO Settings
						</h2>
						<ChevronDown
							size={16}
							className={`text-[var(--sea-ink-soft)] transition ${showSeo ? "rotate-180" : ""}`}
						/>
					</button>

					{showSeo && (
						<div className="mt-4 flex flex-col gap-4">
							<div>
								<label
									htmlFor="meta-title"
									className="mb-1 flex items-center justify-between text-sm font-medium text-[var(--sea-ink)]"
								>
									Meta Title
									<span
										className={`text-xs ${metaTitle.length > 60 ? "text-red-500" : "text-[var(--sea-ink-soft)]"}`}
									>
										{metaTitle.length}/60
									</span>
								</label>
								<input
									id="meta-title"
									type="text"
									value={metaTitle}
									onChange={(e) =>
										setMetaTitle(e.target.value)
									}
									placeholder={title || "Defaults to entry title"}
									className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] transition"
								/>
							</div>
							<div>
								<label
									htmlFor="meta-description"
									className="mb-1 flex items-center justify-between text-sm font-medium text-[var(--sea-ink)]"
								>
									Meta Description
									<span
										className={`text-xs ${metaDescription.length > 160 ? "text-red-500" : "text-[var(--sea-ink-soft)]"}`}
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
									className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] transition resize-y"
								/>
							</div>
							<div>
								<label
									htmlFor="og-image"
									className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
								>
									OG Image URL
								</label>
								<input
									id="og-image"
									type="text"
									value={ogImage}
									onChange={(e) =>
										setOgImage(e.target.value)
									}
									placeholder="Auto-generated if empty"
									className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] transition"
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
									example.com/{slug || "..."}
								</p>
								<p className="text-sm text-[#545454] line-clamp-2">
									{metaDescription ||
										"Meta description will be auto-generated from content..."}
								</p>
							</div>
						</div>
					)}
				</div>

				{/* SEO Analyzer */}
				{title && (
					<SeoAnalyzer
						title={metaTitle || title}
						metaDescription={metaDescription}
						content={Object.values(fieldValues)
							.filter(Boolean)
							.join(" ")}
						slug={slug}
						hasImage={
							!!ogImage ||
							Object.values(fieldValues).some(
								(v) =>
									v &&
									/<img|\.jpg|\.png|\.webp/i.test(v),
							)
						}
					/>
				)}

				{/* Submit */}
				<div className="flex items-center gap-3">
					<button
						type="submit"
						disabled={
							createMutation.isPending ||
							!selectedCollectionId ||
							!title.trim()
						}
						className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
					>
						<Save size={16} />
						{createMutation.isPending
							? "Creating..."
							: "Create Entry"}
					</button>
					<button
						type="button"
						onClick={() => navigate({ to: "/admin/entries" })}
						className="rounded-lg bg-[var(--foam)] px-4 py-2 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--sand)]"
					>
						Cancel
					</button>
				</div>

				{createMutation.isError && (
					<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						Failed to create entry. Please try again.
					</div>
				)}
			</form>
		</div>
	)
}
