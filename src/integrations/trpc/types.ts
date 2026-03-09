/**
 * Type-only re-export so client code never imports router.ts (which pulls in db/better-sqlite3).
 * Use: import type { TRPCRouter } from '#/integrations/trpc/types'
 */
export type { TRPCRouter } from "./router"
