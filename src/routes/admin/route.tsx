import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"

const getSession = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest()
	const { auth } = await import("#/lib/auth")
	const session = await auth.api.getSession({ headers: request.headers })
	return session
})

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const session = await getSession()
		if (!session?.user) {
			throw redirect({ to: "/login" })
		}
	},
	component: AdminLayout,
})

function AdminLayout() {
	return <Outlet />
}
