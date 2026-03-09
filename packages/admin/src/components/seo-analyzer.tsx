import { useMemo } from "react"
import { CheckCircle2, AlertTriangle, XCircle, Search } from "lucide-react"
import { calculateSeoScore, type SeoCheck } from "../lib/seo"

interface SeoAnalyzerProps {
	title: string
	metaDescription: string
	content: string
	slug: string
	hasImage: boolean
}

const statusIcons: Record<SeoCheck["status"], React.ReactNode> = {
	good: <CheckCircle2 size={14} className="text-green-500" />,
	warning: <AlertTriangle size={14} className="text-yellow-500" />,
	error: <XCircle size={14} className="text-red-500" />,
}
const statusColors: Record<SeoCheck["status"], string> = {
	good: "text-green-700",
	warning: "text-yellow-700",
	error: "text-red-700",
}
function scoreColor(score: number): string {
	if (score >= 80) return "text-green-600"
	if (score >= 50) return "text-yellow-600"
	return "text-red-600"
}
function scoreBg(score: number): string {
	if (score >= 80) return "bg-green-500"
	if (score >= 50) return "bg-yellow-500"
	return "bg-red-500"
}

export default function SeoAnalyzer({ title, metaDescription, content, slug, hasImage }: SeoAnalyzerProps) {
	const seo = useMemo(
		() => calculateSeoScore({ title, metaDescription, content, slug, hasImage }),
		[title, metaDescription, content, slug, hasImage],
	)
	return (
		<div className="island-shell p-5">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--sea-ink)]">
					<Search size={18} className="text-[var(--lagoon)]" />
					SEO Score
				</h2>
				<div className="flex items-center gap-2">
					<div className="h-2.5 w-24 overflow-hidden rounded-full bg-[var(--sand)]">
						<div className={`h-full rounded-full transition-all ${scoreBg(seo.score)}`} style={{ width: `${seo.score}%` }} />
					</div>
					<span className={`text-lg font-bold ${scoreColor(seo.score)}`}>{seo.score}</span>
				</div>
			</div>
			<ul className="flex flex-col gap-2">
				{seo.checks.map((check) => (
					<li key={check.id} className="flex items-start gap-2 text-sm">
						<span className="mt-0.5 shrink-0">{statusIcons[check.status]}</span>
						<div>
							<span className="font-medium text-[var(--sea-ink)]">{check.label}</span>
							<span className={`ml-1 ${statusColors[check.status]}`}>— {check.message}</span>
						</div>
					</li>
				))}
			</ul>
		</div>
	)
}
