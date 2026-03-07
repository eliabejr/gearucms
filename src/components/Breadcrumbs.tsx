import { Link } from "@tanstack/react-router"
import { ChevronRight, Home } from "lucide-react"
import StructuredData from "./StructuredData"
import { generateBreadcrumbJsonLd, getSiteUrl } from "#/lib/seo"

interface BreadcrumbItem {
	label: string
	href: string
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
	const siteUrl = getSiteUrl()

	const fullItems = [{ name: "Home", url: siteUrl }, ...items.map((i) => ({ name: i.label, url: `${siteUrl}${i.href}` }))]

	return (
		<>
			<StructuredData data={generateBreadcrumbJsonLd(fullItems)} />
			<nav aria-label="Breadcrumb" className="mb-6">
				<ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--sea-ink-soft)]">
					<li>
						<Link
							to="/"
							className="flex items-center gap-1 transition hover:text-[var(--sea-ink)]"
						>
							<Home size={14} />
							<span className="sr-only">Home</span>
						</Link>
					</li>
					{items.map((item, index) => (
						<li key={item.href} className="flex items-center gap-1.5">
							<ChevronRight size={14} className="text-[var(--line)]" />
							{index === items.length - 1 ? (
								<span className="font-medium text-[var(--sea-ink)]">
									{item.label}
								</span>
							) : (
								<Link
									to={item.href}
									className="transition hover:text-[var(--sea-ink)]"
								>
									{item.label}
								</Link>
							)}
						</li>
					))}
				</ol>
			</nav>
		</>
	)
}
