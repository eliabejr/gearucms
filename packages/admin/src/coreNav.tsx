import {
	LayoutDashboard,
	Database,
	FileText,
	ImageIcon,
	MessageSquare,
	Settings,
	Sparkles,
	UserPlus,
	BarChart3,
} from "lucide-react"
import type { GearuAdminNavItem } from "./types"

/**
 * Default core nav items for the admin (Dashboard, Collections, Entries, Media, Comments, Leads, Analytics, Settings, AI Writer).
 * Leads and Analytics show in nav always; their routes show the plugin screen when installed or MissingModule when not.
 * Host may override by passing plugins that provide their own nav items (which replace these for matching paths).
 */
export function getCoreNavItems(): GearuAdminNavItem[] {
	return [
		{ path: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
		{ path: "/collections", label: "Collections", icon: Database },
		{ path: "/entries", label: "Entries", icon: FileText },
		{ path: "/media", label: "Media", icon: ImageIcon },
		{ path: "/comments", label: "Comments", icon: MessageSquare },
		{ path: "/leads", label: "Leads", icon: UserPlus },
		{ path: "/analytics", label: "Analytics", icon: BarChart3 },
		{ path: "/settings", label: "Settings", icon: Settings },
		{ path: "/ai-writer", label: "AI Writer", icon: Sparkles },
	]
}
