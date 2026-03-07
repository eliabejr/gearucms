import { createFileRoute } from "@tanstack/react-router"
import { useTRPC } from "#/integrations/trpc/react"
import { useQuery } from "@tanstack/react-query"
import ContentRenderer from "#/components/ContentRenderer"
import Breadcrumbs from "#/components/Breadcrumbs"
import StructuredData from "#/components/StructuredData"
import {
	generateMetaTags,
	generateArticleJsonLd,
	extractExcerpt,
	extractFirstImage,
	getSiteUrl,
} from "#/lib/seo"

export const Route = createFileRoute("/$collection/$slug")({
	loader: async ({ params, context }) => {
		const data = await context.queryClient.ensureQueryData(
			context.trpc.entries.getBySlug.queryOptions({
				collectionSlug: params.collection,
				entrySlug: params.slug,
			}),
		)
		return { entry: data }
	},
	head: ({ loaderData }) => {
		const entry = loaderData?.entry
		if (!entry) {
			return {
				meta: [{ title: "Not Found" }],
			}
		}

		const siteUrl = getSiteUrl()
		const collectionSlug = entry.collection?.slug ?? ""
		const canonical = `${siteUrl}/${collectionSlug}/${entry.slug}`

		// Extract description from richtext/text fields
		const contentFields = (entry.fields ?? [])
			.filter(
				(f) =>
					f.field.type === "richtext" || f.field.type === "text",
			)
			.map((f) => f.value ?? "")
			.join(" ")

		const description =
			entry.metaDescription || extractExcerpt(contentFields)

		// Extract first image
		const imageField = (entry.fields ?? []).find(
			(f) => f.field.type === "image" && f.value,
		)
		const ogImage =
			entry.ogImage ||
			imageField?.value ||
			extractFirstImage(contentFields)

		const metaTitle = entry.metaTitle || entry.title

		return {
			meta: generateMetaTags({
				title: metaTitle,
				description,
				canonical,
				ogImage: ogImage ?? undefined,
				ogType: "article",
				publishedAt: entry.publishedAt
					? new Date(entry.publishedAt).toISOString()
					: undefined,
				modifiedAt: entry.updatedAt
					? new Date(entry.updatedAt).toISOString()
					: undefined,
				section: entry.collection?.name,
			}),
		}
	},
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

	const siteUrl = getSiteUrl()
	const collectionSlug = entry.collection?.slug ?? collection
	const canonical = `${siteUrl}/${collectionSlug}/${entry.slug}`

	const contentFields = (entry.fields ?? [])
		.filter(
			(f) => f.field.type === "richtext" || f.field.type === "text",
		)
		.map((f) => f.value ?? "")
		.join(" ")

	const description =
		entry.metaDescription || extractExcerpt(contentFields)

	const fieldData = (entry.fields ?? []).map((ef) => ({
		field: ef.field,
		value: ef.value,
	}))

	// Article JSON-LD
	const articleJsonLd = generateArticleJsonLd({
		title: entry.metaTitle || entry.title,
		description,
		url: canonical,
		publishedAt: entry.publishedAt
			? new Date(entry.publishedAt).toISOString()
			: new Date().toISOString(),
		modifiedAt: entry.updatedAt
			? new Date(entry.updatedAt).toISOString()
			: undefined,
		image: entry.ogImage ?? undefined,
		section: entry.collection?.name,
	})

	return (
		<main className="page-wrap px-4 py-12">
			<StructuredData data={articleJsonLd} />

			<Breadcrumbs
				items={[
					{
						label: entry.collection?.name ?? collection,
						href: `/${collectionSlug}`,
					},
					{
						label: entry.title,
						href: `/${collectionSlug}/${entry.slug}`,
					},
				]}
			/>

			<article>
				<header className="mb-8">
					<p className="island-kicker mb-2">
						{entry.collection?.name}
					</p>
					<h1 className="mb-4 text-4xl font-bold text-[var(--sea-ink)]">
						{entry.title}
					</h1>
					{entry.publishedAt && (
						<time
							dateTime={new Date(entry.publishedAt).toISOString()}
							className="text-sm text-[var(--sea-ink-soft)]"
						>
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
