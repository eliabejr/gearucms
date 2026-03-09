import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { createFileRoute } from "@tanstack/react-router"

async function handler({ request }: { request: Request }) {
	const { trpcRouter } = await import("#/integrations/trpc/router")
	const { auth } = await import("#/lib/auth")
	return fetchRequestHandler({
		req: request,
		router: trpcRouter,
		endpoint: "/api/trpc",
		createContext: async () => {
			const session = await auth.api.getSession({
				headers: request.headers,
			})
			return { headers: request.headers, session }
		},
	})
}

export const Route = createFileRoute("/api/trpc/$")({
	server: {
		handlers: {
			GET: handler,
			POST: handler,
		},
	},
})
