import type { ComponentType } from "react"
import { Dashboard } from "./screens/Dashboard"
import { Collections } from "./screens/Collections"
import { CollectionId } from "./screens/CollectionId"
import { EntriesIndex } from "./screens/EntriesIndex"
import { EntriesNew } from "./screens/EntriesNew"
import { EntryId } from "./screens/EntryId"
import { EntryPreview } from "./screens/EntryPreview"
import { Media } from "./screens/Media"
import { Comments } from "./screens/Comments"
import { Settings } from "./screens/Settings"
import { AiWriter } from "./screens/AiWriter"
import { MissingModule } from "./screens/MissingModule"

export interface AdminRoute {
	path: string
	Component: ComponentType
}

/** Core admin routes (path is relative to basePath, e.g. / or /collections). Optional module routes (leads, analytics) are fallbacks when plugin not installed. */
export function getCoreRoutes(): AdminRoute[] {
	return [
		{ path: "/", Component: Dashboard },
		{ path: "/collections", Component: Collections },
		{ path: "/collections/:id", Component: CollectionId },
		{ path: "/entries", Component: EntriesIndex },
		{ path: "/entries/new", Component: EntriesNew },
		{ path: "/entries/:id", Component: EntryId },
		{ path: "/entries/:id/preview", Component: EntryPreview },
		{ path: "/media", Component: Media },
		{ path: "/comments", Component: Comments },
		{ path: "/leads", Component: () => <MissingModule moduleName="Leads" slug="leads" /> },
		{ path: "/analytics", Component: () => <MissingModule moduleName="Analytics" slug="analytics" /> },
		{ path: "/settings", Component: Settings },
		{ path: "/ai-writer", Component: AiWriter },
	]
}
