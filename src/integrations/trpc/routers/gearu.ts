import { protectedProcedure } from "../init"

const INSTALLED_VERSION = "1.0.0"

export const gearuRouter = {
	getVersion: protectedProcedure.query(async () => {
		let latest = INSTALLED_VERSION
		try {
			const res = await fetch("https://registry.npmjs.org/@gearu/core/latest", {
				headers: { Accept: "application/json" },
			})
			if (res.ok) {
				const data = (await res.json()) as { version?: string }
				latest = data.version ?? INSTALLED_VERSION
			}
		} catch {
			// ignore
		}
		return { installed: INSTALLED_VERSION, latest }
	}),
}
