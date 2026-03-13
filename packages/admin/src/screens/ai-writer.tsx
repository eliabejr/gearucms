import {
	Upload,
	Sparkles,
	FileSpreadsheet,
	Eye,
	ChevronLeft,
	Loader2,
	CheckCircle2,
	XCircle,
	Clock,
	Pencil,
	Image,
	Save,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useRef, useCallback } from "react"
import Papa from "papaparse"
import { useGearuAdmin } from "../context"
import Select from "../components/select"

type CsvRow = { title: string; schedule: number }
type ImageMode = "gemini" | "openai" | "unsplash" | "pexels" | "none"
const imageModeOptions: { value: ImageMode; label: string }[] = [
	{ value: "none", label: "No Images" },
	{ value: "gemini", label: "Gemini" },
	{ value: "openai", label: "OpenAI" },
	{ value: "unsplash", label: "Unsplash" },
	{ value: "pexels", label: "Pexels" },
]
const itemStatusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ size?: number }> }> = {
	pending: { label: "Pending", color: "text-gray-600", bgColor: "bg-gray-100", icon: Clock },
	generating_text: { label: "Generating Text", color: "text-blue-600", bgColor: "bg-blue-100", icon: Pencil },
	generating_image: { label: "Generating Image", color: "text-purple-600", bgColor: "bg-purple-100", icon: Image },
	saving: { label: "Saving", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: Save },
	completed: { label: "Completed", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle2 },
	failed: { label: "Failed", color: "text-red-600", bgColor: "bg-red-100", icon: XCircle },
}

export function AiWriter() {
	const { useTRPC } = useGearuAdmin()
	const trpc = useTRPC() as {
		collections: { list: { queryOptions: () => { queryKey: unknown[] } } }
		ai: {
			listJobs: { queryOptions: () => { queryKey: unknown[] } }
			getJob: { queryOptions: (opts: { id: number }, opts2?: { enabled: boolean }) => { queryKey: unknown[] } }
			createJob: { mutationOptions: (opts: { onSuccess: (job: { id: number }) => void }) => unknown }
		}
	}
	const queryClient = useQueryClient()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [csvRows, setCsvRows] = useState<CsvRow[]>([])
	const [isDragging, setIsDragging] = useState(false)
	const [collectionId, setCollectionId] = useState<number | undefined>()
	const [imageMode, setImageMode] = useState<ImageMode>("none")
	const [viewingJobId, setViewingJobId] = useState<number | null>(null)

	const { data: collections } = useQuery(trpc.collections.list.queryOptions())
	const { data: jobs } = useQuery(trpc.ai.listJobs.queryOptions())
	const { data: viewingJob } = useQuery(trpc.ai.getJob.queryOptions({ id: viewingJobId! }, { enabled: viewingJobId !== null }))
	const createJobMutation = useMutation(
		trpc.ai.createJob.mutationOptions({
			onSuccess: (job: { id: number }) => {
				queryClient.invalidateQueries({ queryKey: trpc.ai.listJobs.queryKey() })
				setCsvRows([])
				setViewingJobId(job.id)
			},
		}),
	)

	const parseCsv = useCallback((file: File) => {
		Papa.parse<{ title?: string; schedule?: string }>(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				const rows: CsvRow[] = results.data
					.filter((row) => row.title?.trim())
					.map((row) => ({ title: row.title?.trim() ?? "", schedule: Number(row.schedule) || 0 }))
				setCsvRows(rows)
			},
		})
	}, [])
	const handleFileChange = useCallback((files: FileList | null) => {
		const file = files?.[0]
		if (file && file.name.endsWith(".csv")) parseCsv(file)
	}, [parseCsv])
	const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
	const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
	const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files) }, [handleFileChange])
	const getScheduledDate = (scheduleDays: number) => { const d = new Date(); d.setDate(d.getDate() + scheduleDays); return d.toLocaleDateString() }
	const jobStatusColor = (status: string) => { switch (status) { case "completed": return "bg-green-100 text-green-700"; case "processing": return "bg-blue-100 text-blue-700"; case "failed": return "bg-red-100 text-red-700"; default: return "bg-gray-100 text-gray-700" } }

	const job = viewingJob as { id: number; status: string; collection?: { name: string }; items?: { id: number; title: string; status: string; error?: string; tokensUsed?: number }[]; createdAt?: string } | undefined
	const cols = Array.isArray(collections) ? (collections as { id: number; name: string }[]) : []
	const jobsList = (jobs as { id: number; status: string; collection?: { name: string }; items?: unknown[]; createdAt?: string }[]) ?? []

	if (viewingJobId && job) {
		const completedItems = job.items?.filter((i) => i.status === "completed").length ?? 0
		const totalItems = job.items?.length ?? 0
		return (
			<div>
				<div className="mb-6 flex items-center gap-3">
					<button type="button" onClick={() => setViewingJobId(null)} className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]">
						<ChevronLeft size={20} />
					</button>
					<div>
						<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Job #{job.id}</h1>
						<div className="flex items-center gap-3 text-sm text-[var(--sea-ink-soft)]">
							<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${jobStatusColor(job.status)}`}>{job.status}</span>
							<span>{completedItems}/{totalItems} items</span>
							<span>{job.collection?.name ?? "Unknown Collection"}</span>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-3">
					{job.items?.map((item) => {
						const statusConf = itemStatusConfig[item.status] ?? itemStatusConfig.pending
						const StatusIcon = statusConf.icon
						return (
							<div key={item.id} className="island-shell p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusConf.bgColor}`}>
											{item.status === "generating_text" || item.status === "generating_image" || item.status === "saving" ? (
												<Loader2 size={16} className={`animate-spin ${statusConf.color}`} />
											) : (
												<StatusIcon size={16} />
											)}
										</div>
										<div>
											<p className="font-medium text-[var(--sea-ink)]">{item.title}</p>
											<div className="flex items-center gap-3 text-xs text-[var(--sea-ink-soft)]">
												<span className={`rounded-full px-2 py-0.5 font-medium ${statusConf.bgColor} ${statusConf.color}`}>{statusConf.label}</span>
												{(item.tokensUsed ?? 0) > 0 && <span>{item.tokensUsed} tokens</span>}
											</div>
										</div>
									</div>
								</div>
								{item.error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{item.error}</p>}
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">AI Writer</h1>
				<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">Upload a CSV with titles and schedule to bulk-generate content</p>
			</div>
			<div className="island-shell mb-6 p-5">
				<h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--sea-ink)]">
					<FileSpreadsheet size={20} className="text-[var(--lagoon)]" />
					Upload CSV
				</h2>
				<div
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => fileInputRef.current?.click()}
					onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
					role="button"
					tabIndex={0}
					className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition ${isDragging ? "border-[var(--lagoon)] bg-[var(--lagoon)]/5" : "border-[var(--line)] hover:border-[var(--lagoon)]"}`}
				>
					<Upload size={28} className={isDragging ? "text-[var(--lagoon)]" : "text-[var(--sea-ink-soft)]"} />
					<p className="text-sm text-[var(--sea-ink-soft)]">{isDragging ? "Drop CSV here..." : "Drag and drop a CSV file, or click to browse"}</p>
					<p className="text-xs text-[var(--sea-ink-soft)]">Format: title, schedule (days from now)</p>
				</div>
				<input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { handleFileChange(e.target.files); e.target.value = "" }} />
			</div>
			{csvRows.length > 0 && (
				<div className="island-shell mb-6 overflow-hidden">
					<div className="flex items-center justify-between p-5 pb-0">
						<h2 className="text-lg font-semibold text-[var(--sea-ink)]">Preview ({csvRows.length} items)</h2>
						<button type="button" onClick={() => setCsvRows([])} className="text-sm text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]">Clear</button>
					</div>
					<div className="mt-4">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b border-[var(--line)] bg-[var(--foam)]">
									<th className="px-5 py-3 font-medium text-[var(--sea-ink-soft)]">#</th>
									<th className="px-5 py-3 font-medium text-[var(--sea-ink-soft)]">Title</th>
									<th className="px-5 py-3 font-medium text-[var(--sea-ink-soft)]">Scheduled Date</th>
								</tr>
							</thead>
							<tbody>
								{csvRows.map((row, i) => (
									<tr key={`${row.title}-${i}`} className="border-b border-[var(--line)] last:border-0">
										<td className="px-5 py-3 text-[var(--sea-ink-soft)]">{i + 1}</td>
										<td className="px-5 py-3 font-medium text-[var(--sea-ink)]">{row.title}</td>
										<td className="px-5 py-3 text-[var(--sea-ink-soft)]">{row.schedule === 0 ? "Immediately" : `${getScheduledDate(row.schedule)} (+${row.schedule}d)`}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="border-t border-[var(--line)] p-5">
						<div className="flex flex-wrap items-end gap-4">
							<div className="min-w-[200px]">
								<label htmlFor="ai-collection" className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]">Collection</label>
								<Select id="ai-collection" value={collectionId?.toString() ?? ""} onChange={(val) => setCollectionId(val ? Number(val) : undefined)} options={cols.map((col) => ({ value: String(col.id), label: col.name }))} placeholder="Select collection..." isClearable />
							</div>
							<div className="min-w-[180px]">
								<label htmlFor="ai-image-mode" className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]">Image Mode</label>
								<Select id="ai-image-mode" value={imageMode} onChange={(val) => setImageMode(val as ImageMode)} options={imageModeOptions.map((opt) => ({ value: opt.value, label: opt.label }))} isSearchable={false} />
							</div>
							<button
								type="button"
								disabled={!collectionId || csvRows.length === 0 || createJobMutation.isPending}
								onClick={() => { if (collectionId) createJobMutation.mutate({ csvRows, collectionId, imageMode } as any) }}
								className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
							>
								{createJobMutation.isPending ? <><Loader2 size={16} className="animate-spin" />Creating...</> : <><Sparkles size={16} />Start Generation</>}
							</button>
						</div>
					</div>
				</div>
			)}
			<div className="island-shell p-5">
				<h2 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">Jobs</h2>
				{!jobsList.length ? (
					<p className="text-sm text-[var(--sea-ink-soft)]">No AI generation jobs yet.</p>
				) : (
					<div className="flex flex-col gap-2">
						{jobsList.map((jobItem) => {
							const completed = jobItem.items?.filter((i: { status: string }) => i.status === "completed").length ?? 0
							const total = jobItem.items?.length ?? 0
							return (
								<button key={jobItem.id} type="button" onClick={() => setViewingJobId(jobItem.id)} className="flex items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-[var(--foam)]">
									<div className="flex items-center gap-3">
										<Sparkles size={18} className="text-[var(--lagoon)]" />
										<div>
											<p className="text-sm font-medium text-[var(--sea-ink)]">Job #{jobItem.id} - {jobItem.collection?.name ?? "Unknown"}</p>
											<p className="text-xs text-[var(--sea-ink-soft)]">{completed}/{total} items completed{jobItem.createdAt ? ` - ${new Date(jobItem.createdAt).toLocaleString()}` : ""}</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${jobStatusColor(jobItem.status)}`}>{jobItem.status}</span>
										<Eye size={16} className="text-[var(--sea-ink-soft)]" />
									</div>
								</button>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
