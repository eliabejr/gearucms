import { createTestCaller } from "../../../../tests/helpers/trpc-caller"
import {
	createTestDb,
	destroyTestDb,
	seedSiteSetting,
	seedTrackingScript,
} from "../../../../tests/helpers/test-db"

describe("settings router", () => {
	it("manages site settings, ai config, and tracking scripts", async () => {
		const testDb = createTestDb()
		const caller = createTestCaller(testDb)

		try {
			seedSiteSetting(testDb.connection, "site_name", "Gearu")
			seedSiteSetting(testDb.connection, "ai_api_key_openai", "super-secret-1234")

			expect(await caller.settings.getSiteSettings()).toEqual({
				site_name: "Gearu",
				ai_api_key_openai: "super-secret-1234",
			})
			expect(await caller.settings.getPublicSiteSettings()).toEqual({
				site_name: "Gearu",
			})

			await caller.settings.updateSiteSettings({
				site_name: "Gearu CMS",
				site_description: "Modern publishing",
				empty_setting: "   ",
			})

			expect(await caller.settings.getSiteSettings()).toMatchObject({
				site_name: "Gearu CMS",
				site_description: "Modern publishing",
			})

			const aiConfig = await caller.settings.getAiConfig()
			expect(aiConfig.ai_api_key_openai).toBe("********1234")
			expect(aiConfig.ai_api_key_openai_set).toBe("true")

			await caller.settings.updateAiConfig({
				provider: "openai",
				model: "gpt-4o",
				systemPrompt: "Write clearly",
				apiKeys: {
					openai: "********1234",
					anthropic: "anthropic-secret",
				},
			})

			expect(await caller.settings.getSiteSettings()).toMatchObject({
				ai_default_provider: "openai",
				ai_default_model: "gpt-4o",
				ai_system_prompt: "Write clearly",
				ai_api_key_openai: "super-secret-1234",
				ai_api_key_anthropic: "anthropic-secret",
			})

			const activeScriptId = seedTrackingScript(testDb.connection, {
				name: "Tag Manager",
				active: true,
			})
			const inactiveScriptId = seedTrackingScript(testDb.connection, {
				name: "Inactive",
				active: false,
			})

			const created = await caller.settings.createScript({
				name: "Pixel",
				location: "body_end",
				script: "<script>pixel()</script>",
				active: true,
			})

			const scripts = await caller.settings.listScripts()
			expect(scripts.map((script) => script.name)).toEqual(["Inactive", "Pixel", "Tag Manager"])

			const updated = await caller.settings.updateScript({
				id: created.id,
				name: "Meta Pixel",
				active: false,
			})
			expect(updated).toMatchObject({ name: "Meta Pixel", active: false })

			const activeScripts = await caller.settings.getActiveScripts()
			expect(activeScripts.map((script) => script.id).sort((a, b) => a - b)).toEqual([activeScriptId])

			await caller.settings.deleteScript({ id: inactiveScriptId })
			expect((await caller.settings.listScripts()).some((script) => script.id === inactiveScriptId)).toBe(false)
		} finally {
			destroyTestDb(testDb.connection)
		}
	})
})
