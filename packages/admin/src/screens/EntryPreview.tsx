import { ArrowLeft, Eye } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useGearuAdmin } from "../context"
import ContentRenderer from "../components/ContentRenderer"

export function EntryPreview() {
	const { useTRPC, Link, basePath, params } = useGearuAdmin()
	const id = params?.id ? Number(params.id) : NaN
	const trpc = useTRPC() as {
		entries: { getById: { queryOptions: (opts: { id: number }) => { queryKey: unknown[] } } }
	}
	const { data: entry, isLoading } = useQuery(trpc.entries.getById.queryOptions({ id }))

	if (isLoading) return <div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">Loading preview...</div>
	if (!entry) return <div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">Entry not found</div>

	const e = entry as {
		title: string
		status: string
		publishedAt?: string
		collection?: { name: string }
		fields?: { field: { name: string; slug: string; type: string }; value: string | null }[]
	}
	const fieldData = (e.fields ?? []).map((ef) => ({ field: ef.field, value: ef.value }))

	return (
		<div>
			{e.status !== "published" && (
				<div className="mb-4 flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
					<Eye size={16} />
					Preview Mode — This entry is not published yet
				</div>
			)}
			<div className="mb-4 flex items-center gap-3">
				<Link to={`${basePath}/entries/${id}`} className="flex items-center gap-1 text-sm text-[var(--sea-ink-soft)] no-underline transition hover:text-[var(--sea-ink)]">
					<ArrowLeft size={16} />
					Back to Editor
				</Link>
			</div>
			<div className="island-shell mx-auto max-w-3xl p-8">
				<article>
					<header className="mb-8">
						<p className="island-kicker mb-2">{e.collection?.name}</p>
						<h1 className="mb-4 text-4xl font-bold text-[var(--sea-ink)]">{e.title}</h1>
						{e.publishedAt && (
							<time className="text-sm text-[var(--sea-ink-soft)]">{new Date(e.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time>
						)}
					</header>
					<ContentRenderer fields={fieldData} />
				</article>
			</div>
		</div>
	)
}
