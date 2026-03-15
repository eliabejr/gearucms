import type { TRPCError } from "@trpc/server"
import { ZodError } from "zod"

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again."
type ZodLikeIssue = {
	code?: string
	input?: unknown
	minimum?: number | bigint
	message?: string
	path?: readonly PropertyKey[]
}

function toLabel(path: readonly PropertyKey[]): string {
	const parts = path
		.map((segment) => String(segment))
		.flatMap((segment) => segment.split("."))
		.map((segment) => segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim())
		.filter(Boolean)

	if (!parts.length) return "This field"

	const label = parts.join(" ")
	return label.charAt(0).toUpperCase() + label.slice(1)
}

function normalizeMessage(message: string): string {
	const trimmed = message.trim()
	if (!trimmed) return DEFAULT_ERROR_MESSAGE
	const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
	return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`
}

function getFirstZodIssue(source: unknown): ZodLikeIssue | null {
	if (source instanceof ZodError) {
		return source.issues[0] ?? null
	}

	if (Array.isArray(source)) {
		return (source[0] as ZodLikeIssue | undefined) ?? null
	}

	if (source && typeof source === "object" && "issues" in source && Array.isArray(source.issues)) {
		return (source.issues[0] as ZodLikeIssue | undefined) ?? null
	}

	if (typeof source === "string") {
		try {
			const parsed = JSON.parse(source) as unknown
			return getFirstZodIssue(parsed)
		} catch {
			return null
		}
	}

	return null
}

function getZodErrorMessage(source: unknown): string | null {
	const issue = getFirstZodIssue(source)
	if (!issue) return null

	const label = toLabel(issue.path ?? [])

	if (issue.code === "invalid_type" && issue.input === undefined) {
		return `${label} is required.`
	}

	if (issue.code === "too_small" && issue.minimum === 1) {
		return `${label} is required.`
	}

	return normalizeMessage(issue.message || `${label} is invalid`)
}

function getCauseMessage(cause: unknown): string | null {
	if (cause instanceof Error) return cause.message
	if (typeof cause === "string") return cause
	return null
}

function getConstraintMessage(message: string): string | null {
	if (!message.includes("UNIQUE constraint failed")) return null
	if (message.includes("collections.slug")) return "A collection with this name already exists."
	if (message.includes("user.email")) return "An account with this email already exists."
	return "This record already exists."
}

export function getUserFacingErrorMessage(error: Pick<TRPCError, "code" | "message" | "cause">): string {
	const zodCauseMessage = getZodErrorMessage(error.cause)
	if (zodCauseMessage) {
		return zodCauseMessage
	}

	const zodMessage = getZodErrorMessage(error.message)
	if (zodMessage) {
		return zodMessage
	}

	const causeMessage = getCauseMessage(error.cause)
	const constraintMessage = causeMessage ? getConstraintMessage(causeMessage) : null
	if (constraintMessage) return constraintMessage

	if (error.code === "UNAUTHORIZED") return "You must be signed in to do that."
	if (error.code === "NOT_FOUND") return normalizeMessage(error.message || "The requested resource was not found")
	if (error.code === "INTERNAL_SERVER_ERROR") return DEFAULT_ERROR_MESSAGE

	return normalizeMessage(error.message)
}
