import type { ComponentType } from "react"
import { Dashboard } from "./screens/dashboard"
import { Collections } from "./screens/collections"
import { CollectionId } from "./screens/collection-id"
import { EntriesIndex } from "./screens/entries-index"
import { EntriesNew } from "./screens/entries-new"
import { EntryId } from "./screens/entry-id"
import { EntryPreview } from "./screens/entry-preview"
import { Media } from "./screens/media"
import { Comments } from "./screens/comments"
import { Settings } from "./screens/settings"
import { AiWriter } from "./screens/ai-writer"
import { MissingModule } from "./screens/missing-module"

export interface AdminRoute {
	path: string
	Component: ComponentType
}

/** Core admin routes. Optional module routes fall back to MissingModule when the plugin is not installed. */
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
