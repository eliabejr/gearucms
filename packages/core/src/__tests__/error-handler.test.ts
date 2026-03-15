import { TRPCError } from "@trpc/server"
import { ZodError } from "zod"
import { getUserFacingErrorMessage } from "../trpc/error-handler"

describe("tRPC error handler", () => {
	it("prettifies required zod messages", () => {
		const error = new TRPCError({
			code: "BAD_REQUEST",
			cause: new ZodError([
				{
					code: "too_small",
					minimum: 1,
					inclusive: true,
					input: "",
					origin: "string",
					path: ["name"],
					message: "Too small: expected string to have >=1 characters",
				},
			]),
		})

		expect(getUserFacingErrorMessage(error)).toBe("Name is required.")
	})

	it("prettifies known unique constraint errors", () => {
		const error = new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			cause: new Error("UNIQUE constraint failed: collections.slug"),
		})

		expect(getUserFacingErrorMessage(error)).toBe("A collection with this name already exists.")
	})

	it("hides raw internal server errors", () => {
		const error = new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			cause: new Error("SQLITE_BUSY: database is locked"),
		})

		expect(getUserFacingErrorMessage(error)).toBe("Something went wrong. Please try again.")
	})
})
