import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Eye } from "lucide-react"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery } from "@tanstack/react-query"
import ContentRenderer from "#/components/ContentRenderer"

export const Route = createFileRoute("/admin/entries/$id/preview")({
	component: EntryPreviewPage,
})

function EntryPreviewPage() {
	const { id } = Route.useParams()
	const trpc = useTRPC()

	const { data: entry, isLoading } = useQuery(
		trpc.entries.getById.queryOptions({ id: Number(id) }),
	)

	if (isLoading) {
		return (
			<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
				Loading preview...
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

	const fieldData = (entry.fields ?? []).map((ef) => ({
		field: ef.field,
		value: ef.value,
	}))

	return (
		<div>
			{/* Preview banner */}
			{entry.status !== "published" && (
				<div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
					<Eye size={16} />
					Preview Mode — This entry is not published yet
				</div>
			)}

			<div className="mb-4 flex items-center gap-3">
				<Link
					to="/admin/entries/$id"
					params={{ id }}
					className="flex items-center gap-1 text-sm text-[var(--sea-ink-soft)] no-underline transition hover:text-[var(--sea-ink)]"
				>
					<ArrowLeft size={16} />
					Back to Editor
				</Link>
			</div>

			{/* Simulated public page */}
			<div className="island-shell mx-auto max-w-3xl p-8">
				<article>
					<header className="mb-8">
						<p className="island-kicker mb-2">
							{entry.collection?.name}
						</p>
						<h1 className="mb-4 text-4xl font-bold text-[var(--sea-ink)]">
							{entry.title}
						</h1>
						{entry.publishedAt && (
							<time className="text-sm text-[var(--sea-ink-soft)]">
								{new Date(entry.publishedAt).toLocaleDateString(
									undefined,
									{
										year: "numeric",
										month: "long",
										day: "numeric",
									},
								)}
							</time>
						)}
					</header>

					<ContentRenderer fields={fieldData} />
				</article>
			</div>
		</div>
	)
}
