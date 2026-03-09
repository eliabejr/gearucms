import { PackageX } from "lucide-react"

export interface MissingModuleProps {
	moduleName: string
	slug?: string
}

export function MissingModule({ moduleName, slug }: MissingModuleProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
			<div
				className="flex h-16 w-16 items-center justify-center rounded-2xl"
				style={{ backgroundColor: "var(--foam)", color: "var(--sea-ink-soft)" }}
			>
				<PackageX size={32} strokeWidth={1.5} />
			</div>
			<div className="max-w-md space-y-2">
				<h1 className="text-xl font-semibold text-[var(--sea-ink)]">
					{moduleName} module is not installed
				</h1>
				<p className="text-sm text-[var(--sea-ink-soft)]">
					{slug === "leads"
						? "Install the Leads plugin to capture and manage form submissions and leads from your site."
						: slug === "analytics"
							? "Install the Analytics plugin to track page views and view dashboard metrics."
							: `Install the ${moduleName} plugin to enable this section.`}
				</p>
			</div>
			<p className="text-xs text-[var(--sea-ink-soft)]">
				Add the plugin to your admin configuration to enable this module.
			</p>
		</div>
	)
}
