import { Upload, Trash2, FileIcon, Copy, Check } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useRef } from "react"
import { useGearuAdmin } from "../context"

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Media() {
	const { useTRPC } = useGearuAdmin()
	const trpc = useTRPC() as {
		media: {
			list: { queryOptions: (opts: { limit: number }) => { queryKey: unknown[] } }
			delete: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
		}
	}
	const queryClient = useQueryClient()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [isDragging, setIsDragging] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [copiedId, setCopiedId] = useState<number | null>(null)

	const { data: mediaList, isLoading } = useQuery(trpc.media.list.queryOptions({ limit: 100 }))
	const deleteMutation = useMutation(
		trpc.media.delete.mutationOptions({
			onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.media.list.queryKey() }),
		}),
	)

	const handleUpload = useCallback(
		async (files: FileList | File[]) => {
			setUploading(true)
			try {
				for (const file of Array.from(files)) {
					const formData = new FormData()
					formData.append("file", file)
					await fetch("/api/upload", { method: "POST", body: formData })
				}
				queryClient.invalidateQueries({ queryKey: trpc.media.list.queryKey() })
			} catch (err) {
				console.error("Upload failed:", err)
			} finally {
				setUploading(false)
			}
		},
		[queryClient, trpc.media.list],
	)

	const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
	const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setIsDragging(false)
			if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files)
		},
		[handleUpload],
	)

	const copyToClipboard = useCallback((url: string, id: number) => {
		navigator.clipboard.writeText(url)
		setCopiedId(id)
		setTimeout(() => setCopiedId(null), 2000)
	}, [])

	const isImage = (mimeType: string | null) => mimeType?.startsWith("image/") ?? false
	const list = (mediaList as { id: number; url: string; filename: string; mimeType: string | null; size?: number; createdAt?: string }[]) ?? []

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Media</h1>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading}
					className="flex items-center gap-2 rounded-lg bg-[var(--lagoon)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
				>
					<Upload size={16} />
					{uploading ? "Uploading..." : "Upload Files"}
				</button>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					className="hidden"
					onChange={(e) => {
						if (e.target.files?.length) {
							handleUpload(e.target.files)
							e.target.value = ""
						}
					}}
				/>
			</div>
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => fileInputRef.current?.click()}
				onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
				role="button"
				tabIndex={0}
				className={`island-shell mb-6 flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 transition ${isDragging ? "border-[var(--lagoon)] bg-[var(--lagoon)]/5" : "border-[var(--line)] hover:border-[var(--lagoon)]"}`}
			>
				<Upload size={32} className={isDragging ? "text-[var(--lagoon)]" : "text-[var(--sea-ink-soft)]"} />
				<p className="text-sm text-[var(--sea-ink-soft)]">{isDragging ? "Drop files here..." : "Drag and drop files here, or click to browse"}</p>
			</div>
			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">Loading...</div>
			) : !list.length ? (
				<div className="island-shell py-12 text-center">
					<p className="text-[var(--sea-ink-soft)]">No media files yet. Upload your first file!</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{list.map((item) => (
						<div key={item.id} className="island-shell group relative overflow-hidden">
							<div className="aspect-square bg-[var(--foam)]">
								{isImage(item.mimeType) ? (
									<img src={item.url} alt={item.filename} className="h-full w-full object-cover" />
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<FileIcon size={40} className="text-[var(--sea-ink-soft)]" />
									</div>
								)}
							</div>
							<div className="p-3">
								<p className="truncate text-sm font-medium text-[var(--sea-ink)]" title={item.filename}>{item.filename}</p>
								<div className="mt-1 flex items-center justify-between text-xs text-[var(--sea-ink-soft)]">
									<span>{formatFileSize(item.size ?? 0)}</span>
									<span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</span>
								</div>
							</div>
							<div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition group-hover:opacity-100">
								<button type="button" onClick={(ev) => { ev.stopPropagation(); copyToClipboard(item.url, item.id) }} className="rounded-lg bg-white/90 p-1.5 text-[var(--sea-ink-soft)] shadow-sm transition hover:text-[var(--lagoon)]" title="Copy URL">
									{copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
								</button>
								<button
									type="button"
									onClick={(ev) => {
										ev.stopPropagation()
										if (confirm(`Delete "${item.filename}"?`)) deleteMutation.mutate({ id: item.id } as any)
									}}
									className="rounded-lg bg-white/90 p-1.5 text-[var(--sea-ink-soft)] shadow-sm transition hover:text-red-600"
									title="Delete"
								>
									<Trash2 size={14} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
