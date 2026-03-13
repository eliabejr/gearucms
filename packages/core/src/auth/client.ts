import { createAuthClient } from "better-auth/react"

export type GearuAuthClientOptions = Parameters<typeof createAuthClient>[0]

/**
 * Creates the Better Auth React client used by host apps.
 */
export function createGearuAuthClient(
	options?: GearuAuthClientOptions,
): ReturnType<typeof createAuthClient> {
	return createAuthClient(options)
}
