import type { ComponentType, ReactNode } from "react"

/** Nav item for the admin sidebar (path is relative to basePath, e.g. "/" or "/collections") */
export interface GearuAdminNavItem {
  path: string
  label: string
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  exact?: boolean
}

/** Link component prop - host provides its router Link */
export interface GearuAdminLinkProps {
  to: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export type GearuAdminLinkComponent = ComponentType<GearuAdminLinkProps>
