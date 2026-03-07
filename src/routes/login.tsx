import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { authClient } from "#/lib/auth-client"

export const Route = createFileRoute("/login")({
	component: LoginPage,
})

function LoginPage() {
	const navigate = useNavigate()
	const [isSignUp, setIsSignUp] = useState(false)
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [name, setName] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError("")
		setLoading(true)

		try {
			if (isSignUp) {
				const result = await authClient.signUp.email({
					email,
					password,
					name,
				})
				if (result.error) {
					setError(result.error.message ?? "Sign up failed")
					return
				}
			} else {
				const result = await authClient.signIn.email({
					email,
					password,
				})
				if (result.error) {
					setError(result.error.message ?? "Sign in failed")
					return
				}
			}
			navigate({ to: "/admin" })
		} catch {
			setError("An unexpected error occurred")
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[var(--foam)] px-4">
			<div className="w-full max-w-sm">
				<div className="island-shell p-8">
					<h1 className="mb-6 text-center text-2xl font-bold text-[var(--sea-ink)]">
						{isSignUp ? "Create Account" : "Sign In"}
					</h1>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						{isSignUp && (
							<div>
								<label
									htmlFor="name"
									className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]"
								>
									Name
								</label>
								<input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
									className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] focus:ring-1 focus:ring-[var(--lagoon)]"
								/>
							</div>
						)}

						<div>
							<label
								htmlFor="email"
								className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]"
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] focus:ring-1 focus:ring-[var(--lagoon)]"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="mb-1 block text-sm font-medium text-[var(--sea-ink-soft)]"
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								className="w-full rounded-lg border border-[var(--line)] bg-[var(--foam)] px-3 py-2 text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] focus:ring-1 focus:ring-[var(--lagoon)]"
							/>
						</div>

						{error && (
							<p className="text-sm text-red-600">{error}</p>
						)}

						<button
							type="submit"
							disabled={loading}
							className="rounded-lg bg-[var(--lagoon)] px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
						>
							{loading
								? "Loading..."
								: isSignUp
									? "Create Account"
									: "Sign In"}
						</button>
					</form>

					<p className="mt-4 text-center text-sm text-[var(--sea-ink-soft)]">
						{isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
						<button
							type="button"
							onClick={() => {
								setIsSignUp(!isSignUp)
								setError("")
							}}
							className="font-medium text-[var(--lagoon)] hover:underline"
						>
							{isSignUp ? "Sign in" : "Sign up"}
						</button>
					</p>
				</div>
			</div>
		</main>
	)
}
