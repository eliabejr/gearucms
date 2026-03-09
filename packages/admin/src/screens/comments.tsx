import { Check, X, Trash2, MessageSquare } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useGearuAdmin } from "../context"

type CommentStatus = "pending" | "approved" | "rejected"
const statusTabs: { value: CommentStatus; label: string }[] = [
	{ value: "pending", label: "Pending" },
	{ value: "approved", label: "Approved" },
	{ value: "rejected", label: "Rejected" },
]

export function Comments() {
	const { useTRPC } = useGearuAdmin()
	const trpc = useTRPC() as {
		comments: {
			list: { queryOptions: (opts: { status: string; limit: number }) => { queryKey: unknown[] } }
			moderate: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
			delete: { mutationOptions: (opts: { onSuccess: () => void }) => unknown }
		}
	}
	const queryClient = useQueryClient()
	const [activeTab, setActiveTab] = useState<CommentStatus>("pending")

	const { data: commentsList, isLoading } = useQuery(trpc.comments.list.queryOptions({ status: activeTab, limit: 100 }))
	const moderateMutation = useMutation(
		trpc.comments.moderate.mutationOptions({
			onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.comments.list.queryKey() }),
		}),
	)
	const deleteMutation = useMutation(
		trpc.comments.delete.mutationOptions({
			onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.comments.list.queryKey() }),
		}),
	)

	const list = (commentsList as { id: number; authorName: string; authorEmail: string; content: string; createdAt?: string; entry?: { title: string } }[]) ?? []

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Comments</h1>
			</div>
			<div className="mb-4 flex w-fit rounded-lg border border-[var(--line)] bg-[var(--sand)]">
				{statusTabs.map((tab) => (
					<button
						key={tab.value}
						type="button"
						onClick={() => setActiveTab(tab.value)}
						className={`px-4 py-2 text-sm font-medium transition ${activeTab === tab.value ? "bg-[var(--lagoon)] text-white" : "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"} first:rounded-l-lg last:rounded-r-lg`}
					>
						{tab.label}
					</button>
				))}
			</div>
			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">Loading...</div>
			) : !list.length ? (
				<div className="island-shell py-12 text-center">
					<div className="flex flex-col items-center gap-2">
						<MessageSquare size={32} className="text-[var(--sea-ink-soft)]" />
						<p className="text-[var(--sea-ink-soft)]">No {activeTab} comments.</p>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{list.map((comment) => (
						<div key={comment.id} className="island-shell p-5">
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<div className="mb-2 flex flex-wrap items-center gap-2">
										<span className="font-medium text-[var(--sea-ink)]">{comment.authorName}</span>
										<span className="text-sm text-[var(--sea-ink-soft)]">{comment.authorEmail}</span>
									</div>
									<p className="mb-3 text-sm text-[var(--sea-ink)]">{comment.content}</p>
									<div className="flex flex-wrap items-center gap-3 text-xs text-[var(--sea-ink-soft)]">
										<span>on <span className="font-medium text-[var(--sea-ink)]">{comment.entry?.title ?? "Unknown Entry"}</span></span>
										<span>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "-"}</span>
									</div>
								</div>
								<div className="flex gap-1">
									{activeTab !== "approved" && (
										<button type="button" onClick={() => moderateMutation.mutate({ id: comment.id, status: "approved" } as any)} disabled={moderateMutation.isPending} className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-green-50 hover:text-green-600" title="Approve">
											<Check size={16} />
										</button>
									)}
									{activeTab !== "rejected" && (
										<button type="button" onClick={() => moderateMutation.mutate({ id: comment.id, status: "rejected" } as any)} disabled={moderateMutation.isPending} className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-orange-50 hover:text-orange-600" title="Reject">
											<X size={16} />
										</button>
									)}
									<button type="button" onClick={() => { if (confirm("Delete this comment permanently?")) deleteMutation.mutate({ id: comment.id } as any) }} disabled={deleteMutation.isPending} className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-red-50 hover:text-red-600" title="Delete">
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
