import { dirname, resolve } from "node:path"
import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-essentials"],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	docs: {
		autodocs: "tag",
	},
	viteFinal: async (config) => {
		config.resolve ??= {}
		config.resolve.alias = [
			...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
			{ find: "@gearu/core/client", replacement: resolve(__dirname, "../../core/src/client.ts") },
			{ find: "@gearu/core/trpc", replacement: resolve(__dirname, "../../core/src/trpc/index.ts") },
			{ find: /^@gearu\/core$/, replacement: resolve(__dirname, "../../core/src/index.ts") },
		]

		config.server ??= {}
		config.server.fs ??= {}
		config.server.fs.allow = [
			...(config.server.fs.allow ?? []),
			dirname(resolve(__dirname, "../../core/src/index.ts")),
		]

		return config
	},
}

export default config
