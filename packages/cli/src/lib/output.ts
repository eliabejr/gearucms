import { getUserFacingErrorMessage } from "@gearu/core/trpc"

export interface JsonFlagOption {
  json?: boolean
}

export function printSuccess<T>(
  result: T,
  options: JsonFlagOption,
  toText: (result: T) => string,
) {
  if (options.json) {
    console.log(JSON.stringify({ success: true, data: result }, null, 2))
    return
  }

  console.log(toText(result))
}

export function printError(error: unknown, options: JsonFlagOption) {
  const message = getErrorMessage(error)

  if (options.json) {
    console.error(
      JSON.stringify(
        {
          success: false,
          error: {
            message,
          },
        },
        null,
        2,
      ),
    )
  } else {
    console.error(message)
  }

  process.exitCode = 1
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return getUserFacingErrorMessage(error as Parameters<typeof getUserFacingErrorMessage>[0])
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong. Please try again."
}
