import { createClient } from "@libsql/client"
import { sql } from "drizzle-orm"
import { createLibSqlDb } from "../db-libsql"
import {
	hashRateLimitKey,
	isEditorialRole,
	isPublicSettingKey,
	sanitizeComment,
	slugify,
} from "../security"
import { createGearuTRPC } from "../trpc/init"

describe("portable security contracts", () => {
	it("creates a libSQL Drizzle database without the native SQLite driver", async () => {
		const client = createClient({ url: "file::memory:" })
		const db = createLibSqlDb(client)
		const result = await db.get<{ value: number }>(sql`select 1 as value`)

		expect(result?.value).toBe(1)
		client.close()
	})

	it("builds Unicode-safe slugs and safe public values", async () => {
		expect(slugify("Crédito, Café & Ações")).toBe("credito-cafe-acoes")
		expect(slugify("Already__slugified Text")).toBe("already-slugified-text")
		expect(sanitizeComment("<script>alert('x')</script>")).not.toContain("<script>")
		expect(isPublicSettingKey("site_description")).toBe(true)
		expect(isPublicSettingKey("stripe_webhook_secret")).toBe(false)
		expect(await hashRateLimitKey("203.0.113.42", "tenant-salt")).toHaveLength(64)
		expect(isEditorialRole("editor")).toBe(true)
		expect(isEditorialRole("member")).toBe(false)
	})

	it("supports role-aware protected procedures", async () => {
		type Context = {
			headers: Headers
			session: { user: { role: string } } | null
		}
		const trpc = createGearuTRPC<Context>({
			authorizeProtected: (ctx) => isEditorialRole(ctx.session?.user.role),
		})
		const router = trpc.createTRPCRouter({
			secret: trpc.protectedProcedure.query(() => "ok"),
		})

		await expect(router.createCaller({
			headers: new Headers(),
			session: { user: { role: "member" } },
		}).secret()).rejects.toMatchObject({ code: "FORBIDDEN" })

		await expect(router.createCaller({
			headers: new Headers(),
			session: { user: { role: "owner" } },
		}).secret()).resolves.toBe("ok")
	})
})

