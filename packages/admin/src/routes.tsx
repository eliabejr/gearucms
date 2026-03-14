import type { ComponentType } from "react"
import { ModuleErrorBoundary } from "./components/error-boundary"
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

/** Wraps a screen component with a module-level error boundary. */
function withErrorBoundary(name: string, Screen: ComponentType): ComponentType {
	return function WrappedScreen() {
		return (
			<ModuleErrorBoundary module={name}>
				<Screen />
			</ModuleErrorBoundary>
		)
	}
}

/** Core admin routes. Optional module routes fall back to MissingModule when the plugin is not installed. */
export function getCoreRoutes(): AdminRoute[] {
	return [
		{ path: "/", Component: withErrorBoundary("Dashboard", Dashboard) },
		{ path: "/collections", Component: withErrorBoundary("Collections", Collections) },
		{ path: "/collections/:id", Component: withErrorBoundary("Collection", CollectionId) },
		{ path: "/entries", Component: withErrorBoundary("Entries", EntriesIndex) },
		{ path: "/entries/new", Component: withErrorBoundary("New Entry", EntriesNew) },
		{ path: "/entries/:id", Component: withErrorBoundary("Entry", EntryId) },
		{ path: "/entries/:id/preview", Component: withErrorBoundary("Preview", EntryPreview) },
		{ path: "/media", Component: withErrorBoundary("Media", Media) },
		{ path: "/comments", Component: withErrorBoundary("Comments", Comments) },
		{ path: "/leads", Component: () => <MissingModule moduleName="Leads" slug="leads" /> },
		{ path: "/analytics", Component: () => <MissingModule moduleName="Analytics" slug="analytics" /> },
		{ path: "/settings", Component: withErrorBoundary("Settings", Settings) },
		{ path: "/ai-writer", Component: withErrorBoundary("AI Writer", AiWriter) },
	]
}
