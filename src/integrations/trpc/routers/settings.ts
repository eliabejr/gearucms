import { z } from "zod"
import { eq } from "drizzle-orm"
import { publicProcedure, protectedProcedure } from "../init"
import { db } from "#/db/index"
import { trackingScripts, siteSettings } from "#/db/schema"
import type { TRPCRouterRecord } from "@trpc/server"

// ─── Known setting keys ─────────────────────────────────────

const SITE_KEYS = [
	"site_name",
	"site_description",
	"site_url",
	"favicon_url",
	"default_og_image",
	"logo_url",
] as const

const AI_KEYS = [
	"ai_default_provider",
	"ai_default_model",
	"ai_api_key_anthropic",
	"ai_api_key_openai",
	"ai_api_key_google",
	"ai_api_key_unsplash",
	"ai_api_key_pexels",
] as const

export const settingsRouter = {
	// ─── Site settings ──────────────────────────────────────

	getSiteSettings: protectedProcedure.query(async () => {
		const rows = await db.select().from(siteSettings)
		const map: Record<string, string> = {}
		for (const row of rows) {
			map[row.key] = row.value
		}
		return map
	}),

	getPublicSiteSettings: publicProcedure.query(async () => {
		const rows = await db.select().from(siteSettings)
		const map: Record<string, string> = {}
		for (const row of rows) {
			// Never expose API keys publicly
			if (row.key.startsWith("ai_api_key_")) continue
			map[row.key] = row.value
		}
		return map
	}),

	updateSiteSettings: protectedProcedure
		.input(
			z.record(z.string(), z.string()),
		)
		.mutation(async ({ input }) => {
			const now = new Date()
			for (const [key, value] of Object.entries(input)) {
				if (!value.trim()) {
					// Delete empty settings
					await db
						.delete(siteSettings)
						.where(eq(siteSettings.key, key))
				} else {
					// Upsert
					const existing = await db.query.siteSettings.findFirst({
						where: eq(siteSettings.key, key),
					})
					if (existing) {
						await db
							.update(siteSettings)
							.set({ value, updatedAt: now })
							.where(eq(siteSettings.key, key))
					} else {
						await db
							.insert(siteSettings)
							.values({ key, value, updatedAt: now })
					}
				}
			}
			return { success: true }
		}),

	// ─── AI provider config ─────────────────────────────────

	getAiConfig: protectedProcedure.query(async () => {
		const rows = await db.select().from(siteSettings)
		const config: Record<string, string> = {}
		for (const row of rows) {
			if (row.key.startsWith("ai_")) {
				// Mask API keys — only show last 4 chars
				if (row.key.startsWith("ai_api_key_") && row.value.length > 4) {
					config[row.key] = "••••••••" + row.value.slice(-4)
					config[`${row.key}_set`] = "true"
				} else {
					config[row.key] = row.value
				}
			}
		}
		return config
	}),

	updateAiConfig: protectedProcedure
		.input(
			z.object({
				provider: z.string().optional(),
				model: z.string().optional(),
				apiKeys: z
					.record(z.string(), z.string())
					.optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const now = new Date()
			const updates: Record<string, string> = {}

			if (input.provider) updates.ai_default_provider = input.provider
			if (input.model) updates.ai_default_model = input.model
			if (input.apiKeys) {
				for (const [provider, key] of Object.entries(input.apiKeys)) {
					// Skip masked values (user didn't change them)
					if (key.startsWith("••••••••")) continue
					updates[`ai_api_key_${provider}`] = key
				}
			}

			for (const [key, value] of Object.entries(updates)) {
				if (!value.trim()) {
					await db
						.delete(siteSettings)
						.where(eq(siteSettings.key, key))
				} else {
					const existing = await db.query.siteSettings.findFirst({
						where: eq(siteSettings.key, key),
					})
					if (existing) {
						await db
							.update(siteSettings)
							.set({ value, updatedAt: now })
							.where(eq(siteSettings.key, key))
					} else {
						await db
							.insert(siteSettings)
							.values({ key, value, updatedAt: now })
					}
				}
			}

			return { success: true }
		}),

	// ─── Tracking scripts ───────────────────────────────────

	listScripts: protectedProcedure.query(async () => {
		return db.select().from(trackingScripts).orderBy(trackingScripts.name)
	}),

	createScript: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				location: z.enum(["head", "body_start", "body_end"]),
				script: z.string().min(1),
				active: z.boolean().default(true),
			}),
		)
		.mutation(async ({ input }) => {
			const [script] = await db
				.insert(trackingScripts)
				.values(input)
				.returning()
			return script
		}),

	updateScript: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				name: z.string().optional(),
				location: z.enum(["head", "body_start", "body_end"]).optional(),
				script: z.string().optional(),
				active: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { id, ...data } = input
			const [script] = await db
				.update(trackingScripts)
				.set(data)
				.where(eq(trackingScripts.id, id))
				.returning()
			return script
		}),

	deleteScript: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db
				.delete(trackingScripts)
				.where(eq(trackingScripts.id, input.id))
			return { success: true }
		}),

	getActiveScripts: publicProcedure.query(async () => {
		return db
			.select()
			.from(trackingScripts)
			.where(eq(trackingScripts.active, true))
	}),
} satisfies TRPCRouterRecord
