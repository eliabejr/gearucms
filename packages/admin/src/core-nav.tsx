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

/** Returns the default admin sidebar navigation items. */
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
