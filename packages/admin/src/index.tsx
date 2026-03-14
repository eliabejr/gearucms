/** Admin panel styles – loaded when you import from @gearu/admin. Also available as @gearu/admin/styles.css */
import "../styles/admin.css"

export { GearuAdminLayout } from "./gearu-admin-layout"
export { GearuAdmin } from "./gearu-admin"
export { GearuAdminProvider, useGearuAdmin } from "./context"
export { getCoreNavItems } from "./core-nav"
export type { GearuAdminLayoutProps } from "./gearu-admin-layout"
export type { GearuAdminProps } from "./gearu-admin"
export type { GearuAdminContextValue } from "./context"
export type { GearuAdminNavItem, GearuAdminLinkComponent, GearuAdminLinkProps } from "./types"
export { default as Select } from "./components/select"
export type { SelectOption } from "./components/select"
