import { definePlugin } from "@gearu/core"
import { UserPlus } from "lucide-react"
import { leadForms, leads } from "./schema"
import { leadFormsRelations, leadsRelations } from "./relations"
import { LeadsPage } from "./LeadsPage"

export { leadForms, leads, leadFormsRelations, leadsRelations }
export { createLeadsRouter } from "./router"
export type { CreateLeadsRouterContext } from "./router"
export { LeadsPage }

const plugin = definePlugin({
	id: "leads",
	name: "Leads",
	version: "1.0.0",
	schema: {
		leadForms,
		leads,
	},
	admin: {
		navItem: {
			path: "/leads",
			label: "Leads",
			icon: UserPlus,
		},
		route: {
			path: "/leads",
			Component: LeadsPage,
		},
	},
})

export default plugin
