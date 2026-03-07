import { useEffect } from "react"
import { useLocation } from "@tanstack/react-router"
import { useTRPC } from "#/integrations/trpc/react"
import { useMutation } from "@tanstack/react-query"

export default function PageTracker() {
	const trpc = useTRPC()
	const recordView = useMutation(
		trpc.analytics.recordPageView.mutationOptions(),
	)
	const pathname = useLocation({ select: (loc) => loc.pathname })

	useEffect(() => {
		if (typeof window === "undefined") return

		const params = new URLSearchParams(window.location.search)
		recordView.mutate({
			path: pathname,
			referrer: document.referrer || undefined,
			utmSource: params.get("utm_source") || undefined,
			utmMedium: params.get("utm_medium") || undefined,
			utmCampaign: params.get("utm_campaign") || undefined,
			utmTerm: params.get("utm_term") || undefined,
			utmContent: params.get("utm_content") || undefined,
		})
		// Only track on pathname change
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname])

	return null
}
