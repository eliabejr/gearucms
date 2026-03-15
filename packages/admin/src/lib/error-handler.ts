const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again."

type ErrorWithMessage = {
	message?: string
	data?: { userMessage?: string }
	shape?: { message?: string; data?: { userMessage?: string } }
}

export function getErrorMessage(error: unknown): string {
	if (!error || typeof error !== "object") return DEFAULT_ERROR_MESSAGE

	const maybeError = error as ErrorWithMessage

	return (
		maybeError.data?.userMessage
		|| maybeError.shape?.data?.userMessage
		|| maybeError.shape?.message
		|| maybeError.message
		|| DEFAULT_ERROR_MESSAGE
	)
}
