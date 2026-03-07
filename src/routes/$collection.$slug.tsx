import { createFileRoute } from "@tanstack/react-router"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery } from "@tanstack/react-query"
import ContentRenderer from "#/components/ContentRenderer"

export const Route = createFileRoute("/$collection/$slug")({
	component: ContentPage,
})

function ContentPage() {
	const { collection, slug } = Route.useParams()
	const trpc = useTRPC()

	const { data: entry, isLoading } = useQuery(
		trpc.entries.getBySlug.queryOptions({
			collectionSlug: collection,
			entrySlug: slug,
		}),
	)

	if (isLoading) {
		return (
			<main className="page-wrap px-4 py-12">
				<div className="animate-pulse">
					<div className="mb-4 h-10 w-2/3 rounded bg-[var(--sand)]" />
					<div className="mb-2 h-4 w-full rounded bg-[var(--sand)]" />
					<div className="mb-2 h-4 w-full rounded bg-[var(--sand)]" />
					<div className="h-4 w-3/4 rounded bg-[var(--sand)]" />
				</div>
			</main>
		)
	}

	if (!entry) {
		return (
			<main className="page-wrap px-4 py-12 text-center">
				<h1 className="mb-4 text-3xl font-bold text-[var(--sea-ink)]">
					Page Not Found
				</h1>
				<p className="text-[var(--sea-ink-soft)]">
					The content you're looking for doesn't exist or hasn't been
					published yet.
				</p>
			</main>
		)
	}

	const fieldData = (entry.fields ?? []).map((ef) => ({
		field: ef.field,
		value: ef.value,
	}))

	return (
		<main className="page-wrap px-4 py-12">
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
		</main>
	)
}
