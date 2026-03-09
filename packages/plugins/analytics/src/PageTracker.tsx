/**
 * Page view tracker. Renders in the host app root (e.g. __root.tsx).
 * Uses useLocation and useTRPC from the host's context; host must merge createAnalyticsRouter() under "analytics".
 */
import { useEffect } from "react"

export interface PageTrackerProps {
	/** Optional: pathname from useLocation().pathname. If not provided, uses window.location.pathname in effect. */
	pathname?: string
	/** Optional: call to record a page view. If not provided, uses useTRPC().analytics.recordPageView. */
	recordPageView?: (input: {
		path: string
		referrer?: string
		utmSource?: string
		utmMedium?: string
		utmCampaign?: string
		utmTerm?: string
		utmContent?: string
	}) => void
}

/**
 * Standalone tracker that accepts pathname and recordPageView as props (host provides them).
 */
export function PageTracker({ pathname, recordPageView }: PageTrackerProps) {
	useEffect(() => {
		if (typeof window === "undefined" || !recordPageView) return
		const path = pathname ?? window.location.pathname
		const params = new URLSearchParams(window.location.search)
		recordPageView({
			path,
			referrer: document.referrer || undefined,
			utmSource: params.get("utm_source") || undefined,
			utmMedium: params.get("utm_medium") || undefined,
			utmCampaign: params.get("utm_campaign") || undefined,
			utmTerm: params.get("utm_term") || undefined,
			utmContent: params.get("utm_content") || undefined,
		})
	}, [pathname, recordPageView])
	return null
}
