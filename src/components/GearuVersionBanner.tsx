import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "#/integrations/trpc/react"

function parseVersion(v: string): number[] {
	return v.split(".").map(Number)
}

function isNewer(latest: string, installed: string): boolean {
	const a = parseVersion(latest)
	const b = parseVersion(installed)
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		const x = a[i] ?? 0
		const y = b[i] ?? 0
		if (x > y) return true
		if (x < y) return false
	}
	return false
}

export function GearuVersionBanner() {
	const trpc = useTRPC()
	const { data } = useQuery(trpc.gearu.getVersion.queryOptions())
	if (!data || !isNewer(data.latest, data.installed)) return null
	return (
		<div className="mb-4 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--foam)] px-4 py-2 text-sm text-[var(--sea-ink)]">
			<span>
				New Gearu version available: <strong>{data.latest}</strong>. You have {data.installed}.
			</span>
			<code className="rounded bg-[var(--surface)] px-2 py-1 text-xs">
				pnpm update @gearu/core @gearu/admin
			</code>
		</div>
	)
}
