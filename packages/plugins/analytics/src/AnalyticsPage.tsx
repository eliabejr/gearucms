/**
 * Analytics admin page. Renders inside the host app's admin layout.
 * Requires the host to merge createAnalyticsRouter() into the app tRPC router under "analytics".
 */
import { Eye, TrendingUp, BarChart3, Globe, Megaphone } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useGearuAdmin } from "@gearu/admin"

const dateRanges = [
	{ value: 7, label: "7 days" },
	{ value: 30, label: "30 days" },
	{ value: 90, label: "90 days" },
]

function StatCard({
	label,
	value,
	icon: Icon,
	color = "var(--lagoon)",
}: {
	label: string
	value: string | number
	icon: React.ComponentType<{ size?: number }>
	color?: string
}) {
	return (
		<div className="island-shell flex items-center gap-4 p-5">
			<div
				className="flex h-12 w-12 items-center justify-center rounded-xl"
				style={{ backgroundColor: `${color}20`, color }}
			>
				<Icon size={24} />
			</div>
			<div>
				<p className="text-2xl font-bold text-[var(--sea-ink)]">{value}</p>
				<p className="text-sm text-[var(--sea-ink-soft)]">{label}</p>
			</div>
		</div>
	)
}

export function AnalyticsPage() {
	const { useTRPC } = useGearuAdmin()
	const trpc = useTRPC() as {
		analytics: { getDashboard: { queryOptions: (opts: { days: number }) => { queryKey: unknown[] } } }
	}
	const [days, setDays] = useState(30)

	const { data: analytics, isLoading } = useQuery(
		trpc.analytics.getDashboard.queryOptions({ days }),
	)

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[var(--sea-ink)]">Analytics</h1>
				<div className="flex rounded-lg border border-[var(--line)] bg-[var(--sand)]">
					{dateRanges.map((range) => (
						<button
							key={range.value}
							type="button"
							onClick={() => setDays(range.value)}
							className={`px-3 py-1.5 text-sm font-medium transition ${
								days === range.value
									? "bg-[var(--lagoon)] text-white"
									: "text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
							} first:rounded-l-lg last:rounded-r-lg`}
						>
							{range.label}
						</button>
					))}
				</div>
			</div>

			{isLoading ? (
				<div className="py-12 text-center text-sm text-[var(--sea-ink-soft)]">
					Loading...
				</div>
			) : (
				<>
					<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
						<StatCard
							label="Views Today"
							value={(analytics as { viewsToday?: number })?.viewsToday ?? 0}
							icon={Eye}
						/>
						<StatCard
							label="Views This Week"
							value={(analytics as { viewsWeek?: number })?.viewsWeek ?? 0}
							icon={TrendingUp}
							color="#27ae60"
						/>
						<StatCard
							label="Views Total"
							value={(analytics as { viewsTotal?: number })?.viewsTotal ?? 0}
							icon={BarChart3}
							color="#8e44ad"
						/>
					</div>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div className="island-shell p-5">
							<div className="mb-4 flex items-center gap-2">
								<BarChart3 size={18} className="text-[var(--lagoon)]" />
								<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
									Top Pages
								</h2>
							</div>
							{!(analytics as { topPages?: { path: string; count: number }[] })?.topPages?.length ? (
								<p className="text-sm text-[var(--sea-ink-soft)]">
									No page view data yet.
								</p>
							) : (
								<ul className="flex flex-col gap-2">
									{((analytics as { topPages: { path: string; count: number }[] }).topPages).map((page, i) => (
										<li
											key={page.path}
											className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-[var(--foam)]"
										>
											<div className="flex items-center gap-3">
												<span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--foam)] text-xs font-medium text-[var(--sea-ink-soft)]">
													{i + 1}
												</span>
												<span className="font-medium text-[var(--sea-ink)]">
													{page.path}
												</span>
											</div>
											<span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
												{page.count}
											</span>
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="island-shell p-5">
							<div className="mb-4 flex items-center gap-2">
								<Globe size={18} className="text-[var(--lagoon)]" />
								<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
									Traffic Sources
								</h2>
							</div>
							{!(analytics as { trafficSources?: { referrer?: string; count: number }[] })?.trafficSources?.length ? (
								<p className="text-sm text-[var(--sea-ink-soft)]">
									No referrer data yet.
								</p>
							) : (
								<ul className="flex flex-col gap-2">
									{((analytics as { trafficSources: { referrer?: string; count: number }[] }).trafficSources).map((source) => (
										<li
											key={source.referrer ?? "direct"}
											className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-[var(--foam)]"
										>
											<span className="font-medium text-[var(--sea-ink)]">
												{source.referrer || "Direct"}
											</span>
											<span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
												{source.count}
											</span>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>

					<div className="island-shell mt-6 overflow-hidden">
						<div className="flex items-center gap-2 p-5 pb-0">
							<Megaphone size={18} className="text-[var(--lagoon)]" />
							<h2 className="text-lg font-semibold text-[var(--sea-ink)]">
								UTM Campaigns
							</h2>
						</div>
						{!(analytics as { utmCampaigns?: { source?: string; medium?: string; campaign?: string; count: number }[] })?.utmCampaigns?.length ? (
							<div className="p-5">
								<p className="text-sm text-[var(--sea-ink-soft)]">
									No UTM campaign data yet.
								</p>
							</div>
						) : (
							<div className="mt-4">
								<table className="w-full text-left text-sm">
									<thead>
										<tr className="border-b border-[var(--line)] bg-[var(--foam)]">
											<th className="px-5 py-3 font-medium text-[var(--sea-ink-soft)]">
												Source
											</th>
											<th className="px-5 py-3 font-medium text-[var(--sea-ink-soft)]">
												Medium
											</th>
											<th className="px-5 py-3 font-medium text-[var(--sea-ink-soft)]">
												Campaign
											</th>
											<th className="px-5 py-3 text-right font-medium text-[var(--sea-ink-soft)]">
												Count
											</th>
										</tr>
									</thead>
									<tbody>
										{((analytics as { utmCampaigns: { source?: string; medium?: string; campaign?: string; count: number }[] }).utmCampaigns).map((utm, i) => (
											<tr
												// biome-ignore lint/suspicious/noArrayIndexKey: UTM rows can duplicate source/medium/campaign
												key={`utm-${(utm.source ?? "")}-${utm.medium ?? ""}-${utm.campaign ?? ""}-${i}`}
												className="border-b border-[var(--line)] last:border-0"
											>
												<td className="px-5 py-3 text-[var(--sea-ink)]">
													{utm.source || "-"}
												</td>
												<td className="px-5 py-3 text-[var(--sea-ink)]">
													{utm.medium || "-"}
												</td>
												<td className="px-5 py-3 text-[var(--sea-ink)]">
													{utm.campaign || "-"}
												</td>
												<td className="px-5 py-3 text-right">
													<span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--sea-ink-soft)]">
														{utm.count}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	)
}
