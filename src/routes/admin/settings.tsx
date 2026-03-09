import { createFileRoute } from "@tanstack/react-router"
import {
	Plus,
	Pencil,
	Trash2,
	Code,
	ToggleLeft,
	ToggleRight,
	Globe,
	Bot,
	Save,
	Eye,
	EyeOff,
	CheckCircle2,
} from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import Select from "#/components/Select"

export const Route = createFileRoute("/admin/settings")({
	component: SettingsPage,
})

type SettingsTab = "general" | "ai" | "scripts"

const AI_PROVIDERS = [
	{ value: "anthropic", label: "Anthropic (Claude)", models: ["claude-sonnet-4-20250514", "claude-haiku-4-20250414"] },
	{ value: "openai", label: "OpenAI (GPT)", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
	{ value: "google", label: "Google (Gemini)", models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"] },
] as const

const API_KEY_PROVIDERS = [
	{ key: "anthropic", label: "Anthropic", placeholder: "sk-ant-..." },
	{ key: "openai", label: "OpenAI", placeholder: "sk-..." },
	{ key: "google", label: "Google AI", placeholder: "AIza..." },
	{ key: "unsplash", label: "Unsplash", placeholder: "Access Key" },
	{ key: "pexels", label: "Pexels", placeholder: "API Key" },
] as const

const locationLabels: Record<string, string> = {
	head: "Head",
	body_start: "Body Start",
	body_end: "Body End",
}

function SettingsPage() {
	const [activeTab, setActiveTab] = useState<SettingsTab>("general")

	const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
		{ id: "general", label: "General", icon: <Globe size={16} /> },
		{ id: "ai", label: "AI Providers", icon: <Bot size={16} /> },
		{ id: "scripts", label: "Tracking Scripts", icon: <Code size={16} /> },
	]

	return (
		<div>
			<h1 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">
				Settings
			</h1>

			{/* Tab bar */}
			<div className="mb-6 flex gap-1 rounded-lg border-b border-[var(--line)]">
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

			{activeTab === "general" && <GeneralSettings />}
			{activeTab === "ai" && <AiProviderSettings />}
			{activeTab === "scripts" && <TrackingScriptSettings />}
		</div>
	)
}

// ─── General Settings ───────────────────────────────────────

function GeneralSettings() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: settings, isLoading } = useQuery(
		trpc.settings.getSiteSettings.queryOptions(),
	)

	const [siteName, setSiteName] = useState("")
	const [siteDescription, setSiteDescription] = useState("")
	const [siteUrl, setSiteUrl] = useState("")
	const [faviconUrl, setFaviconUrl] = useState("")
	const [defaultOgImage, setDefaultOgImage] = useState("")
	const [logoUrl, setLogoUrl] = useState("")

	useEffect(() => {
		if (settings) {
			setSiteName(settings.site_name ?? "")
			setSiteDescription(settings.site_description ?? "")
			setSiteUrl(settings.site_url ?? "")
			setFaviconUrl(settings.favicon_url ?? "")
			setDefaultOgImage(settings.default_og_image ?? "")
			setLogoUrl(settings.logo_url ?? "")
		}
	}, [settings])

	const saveMutation = useMutation(
		trpc.settings.updateSiteSettings.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.settings.getSiteSettings.queryKey(),
				})
			},
		}),
	)

	const handleSave = () => {
		saveMutation.mutate({
			site_name: siteName,
			site_description: siteDescription,
			site_url: siteUrl,
			favicon_url: faviconUrl,
			default_og_image: defaultOgImage,
			logo_url: logoUrl,
		})
	}

	if (isLoading) {
		return (
			<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				Loading...
			</div>
		)
	}

	const inputClass =
		"w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] transition"

	return (
		<div className="island-shell p-5">
			<div className="mb-5 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
					Site Information
				</h2>
				<button
					type="button"
					onClick={handleSave}
					disabled={saveMutation.isPending}
					className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
				>
					{saveMutation.isPending ? (
						"Saving..."
					) : saveMutation.isSuccess ? (
						<>
							<CheckCircle2 size={16} />
							Saved
						</>
					) : (
						<>
							<Save size={16} />
							Save
						</>
					)}
				</button>
			</div>

			<div className="flex flex-col gap-5">
				<div>
					<label htmlFor="site-name" className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
						Site Name
					</label>
					<input
						id="site-name"
						type="text"
						value={siteName}
						onChange={(e) => setSiteName(e.target.value)}
						placeholder="My Awesome Site"
						className={inputClass}
					/>
					<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
						Used in meta tags, structured data, and the admin header.
					</p>
				</div>

				<div>
					<label htmlFor="site-desc" className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
						Site Description
					</label>
					<textarea
						id="site-desc"
						value={siteDescription}
						onChange={(e) => setSiteDescription(e.target.value)}
						placeholder="A brief description of your site"
						rows={3}
						className={`${inputClass} resize-y`}
					/>
					<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
						Default meta description for the homepage.
					</p>
				</div>

				<div>
					<label htmlFor="site-url" className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
						Site URL
					</label>
					<input
						id="site-url"
						type="url"
						value={siteUrl}
						onChange={(e) => setSiteUrl(e.target.value)}
						placeholder="https://example.com"
						className={inputClass}
					/>
					<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
						Used for canonical URLs, sitemaps, and OG tags.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<div>
						<label htmlFor="favicon-url" className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
							Favicon URL
						</label>
						<input
							id="favicon-url"
							type="text"
							value={faviconUrl}
							onChange={(e) => setFaviconUrl(e.target.value)}
							placeholder="/favicon.ico"
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="logo-url" className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
							Logo URL
						</label>
						<input
							id="logo-url"
							type="text"
							value={logoUrl}
							onChange={(e) => setLogoUrl(e.target.value)}
							placeholder="/logo.png"
							className={inputClass}
						/>
					</div>
				</div>

				<div>
					<label htmlFor="default-og" className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
						Default OG Image
					</label>
					<input
						id="default-og"
						type="text"
						value={defaultOgImage}
						onChange={(e) => setDefaultOgImage(e.target.value)}
						placeholder="https://example.com/og-default.jpg"
						className={inputClass}
					/>
					<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
						Fallback image for social sharing when a page has no specific OG image.
					</p>
				</div>
			</div>
		</div>
	)
}

// ─── AI Provider Settings ───────────────────────────────────

function AiProviderSettings() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: aiConfig, isLoading } = useQuery(
		trpc.settings.getAiConfig.queryOptions(),
	)

	const [provider, setProvider] = useState("anthropic")
	const [model, setModel] = useState("")
	const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
	const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})

	useEffect(() => {
		if (aiConfig) {
			setProvider(aiConfig.ai_default_provider ?? "anthropic")
			setModel(aiConfig.ai_default_model ?? "")
			const keys: Record<string, string> = {}
			for (const p of API_KEY_PROVIDERS) {
				const val = aiConfig[`ai_api_key_${p.key}`]
				if (val) keys[p.key] = val
			}
			setApiKeys(keys)
		}
	}, [aiConfig])

	const saveMutation = useMutation(
		trpc.settings.updateAiConfig.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.settings.getAiConfig.queryKey(),
				})
			},
		}),
	)

	const handleSave = () => {
		saveMutation.mutate({
			provider,
			model,
			apiKeys,
		})
	}

	const selectedProvider = AI_PROVIDERS.find((p) => p.value === provider)
	const models = selectedProvider?.models ?? []

	if (isLoading) {
		return (
			<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				Loading...
			</div>
		)
	}

	const inputClass =
		"w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] transition"

	return (
		<div className="flex flex-col gap-6">
			{/* Default provider & model */}
			<div className="island-shell p-5">
				<div className="mb-5 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
						Default AI Provider
					</h2>
					<button
						type="button"
						onClick={handleSave}
						disabled={saveMutation.isPending}
						className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
					>
						{saveMutation.isPending ? (
							"Saving..."
						) : saveMutation.isSuccess ? (
							<>
								<CheckCircle2 size={16} />
								Saved
							</>
						) : (
							<>
								<Save size={16} />
								Save
							</>
						)}
					</button>
				</div>

				<div className="flex flex-col gap-4">
					<div>
						<label
							htmlFor="ai-provider"
							className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
						>
							Provider
						</label>
						<Select
							id="ai-provider"
							value={provider}
							onChange={(val) => {
								setProvider(val)
								const found = AI_PROVIDERS.find(
									(p) => p.value === val,
								)
								if (found?.models[0]) setModel(found.models[0])
							}}
							options={AI_PROVIDERS.map((p) => ({
								value: p.value,
								label: p.label,
							}))}
							placeholder="Select provider..."
						/>
						<p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
							Maps to TanStack AI adapter:{" "}
							<code className="rounded bg-[var(--foam)] px-1 py-0.5 text-[var(--lagoon)]">
								{provider === "anthropic"
									? "anthropicText"
									: provider === "openai"
										? "openaiText"
										: "googleText"}
							</code>
						</p>
					</div>

					<div>
						<label
							htmlFor="ai-model"
							className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
						>
							Model
						</label>
						<Select
							id="ai-model"
							value={model}
							onChange={(val) => setModel(val)}
							options={models.map((m) => ({
								value: m,
								label: m,
							}))}
							placeholder="Select a model..."
						/>
					</div>
				</div>
			</div>

			{/* API Keys */}
			<div className="island-shell p-5">
				<h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
					API Keys
				</h2>
				<p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
					API keys are stored securely. Only the last 4 characters are
					displayed after saving.
				</p>
				<div className="flex flex-col gap-4">
					{API_KEY_PROVIDERS.map((p) => {
						const isSet =
							aiConfig?.[`ai_api_key_${p.key}_set`] === "true"
						return (
							<div key={p.key}>
								<label
									htmlFor={`api-key-${p.key}`}
									className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--sea-ink)]"
								>
									{p.label}
									{isSet && (
										<span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
											configured
										</span>
									)}
								</label>
								<div className="relative">
									<input
										id={`api-key-${p.key}`}
										type={
											visibleKeys[p.key]
												? "text"
												: "password"
										}
										value={apiKeys[p.key] ?? ""}
										onChange={(e) =>
											setApiKeys((prev) => ({
												...prev,
												[p.key]: e.target.value,
											}))
										}
										placeholder={p.placeholder}
										className={`${inputClass} pr-10 font-mono`}
									/>
									<button
										type="button"
										onClick={() =>
											setVisibleKeys((prev) => ({
												...prev,
												[p.key]: !prev[p.key],
											}))
										}
										className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
										title={
											visibleKeys[p.key]
												? "Hide"
												: "Show"
										}
									>
										{visibleKeys[p.key] ? (
											<EyeOff size={16} />
										) : (
											<Eye size={16} />
										)}
									</button>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

// ─── Tracking Scripts Settings ──────────────────────────────

function TrackingScriptSettings() {
	const trpc = useTRPC()
	const queryClient = useQueryClient()

	const { data: scripts, isLoading } = useQuery(
		trpc.settings.listScripts.queryOptions(),
	)

	const [showCreate, setShowCreate] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [formName, setFormName] = useState("")
	const [formLocation, setFormLocation] = useState<
		"head" | "body_start" | "body_end"
	>("head")
	const [formScript, setFormScript] = useState("")
	const [formActive, setFormActive] = useState(true)

	const invalidateScripts = () => {
		queryClient.invalidateQueries({
			queryKey: trpc.settings.listScripts.queryKey(),
		})
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
		setFormLocation(
			script.location as "head" | "body_start" | "body_end",
		)
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
			<div className="mb-4 flex items-center justify-end">
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

			{showCreate && (
				<div className="island-shell mb-6 p-5">
					<h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
						{editingId ? "Edit Script" : "Add Tracking Script"}
					</h2>
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-4"
					>
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
									onChange={(e) =>
										setFormName(e.target.value)
									}
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
								<Select
									id="script-location"
									value={formLocation}
									onChange={(val) =>
										setFormLocation(
											val as
												| "head"
												| "body_start"
												| "body_end",
										)
									}
									options={[
										{ value: "head", label: "Head" },
										{ value: "body_start", label: "Body Start" },
										{ value: "body_end", label: "Body End" },
									]}
									placeholder="Select location..."
								/>
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
								onChange={(e) =>
									setFormScript(e.target.value)
								}
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
								onChange={(e) =>
									setFormActive(e.target.checked)
								}
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

			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
					Loading...
				</div>
			) : !scripts?.length ? (
				<div className="island-shell py-12 text-center">
					<div className="flex flex-col items-center gap-2">
						<Code
							size={32}
							className="text-[var(--sea-ink-soft)]"
						/>
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
												active: !(
													script.active ?? true
												),
											})
										}
										className="text-[var(--sea-ink-soft)] transition hover:text-[var(--lagoon)]"
										title={
											script.active
												? "Deactivate"
												: "Activate"
										}
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
											{locationLabels[script.location] ??
												script.location}
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
