import type React from "react"
import { definePlugin } from "@gearu/core/client"
import { BarChart3 } from "lucide-react"
import { pageViews } from "./schema"
import { createAnalyticsRouter } from "./router"
import { AnalyticsPage } from "./AnalyticsPage"
import { PageTracker } from "./PageTracker"

export { pageViews }
export { createAnalyticsRouter } from "./router"
export type { CreateAnalyticsRouterContext } from "./router"
export { AnalyticsPage, PageTracker }

const plugin = definePlugin({
	id: "analytics",
	name: "Analytics",
	version: "1.0.0",
	schema: {
		pageViews,
	},
	admin: {
		navItem: {
			path: "/analytics",
			label: "Analytics",
			icon: BarChart3,
		},
		route: {
			path: "/analytics",
			Component: AnalyticsPage,
		},
	},
	rootComponents: [
		{
			Component: PageTracker as React.ComponentType,
			order: 0,
		},
	],
})

export default plugin
