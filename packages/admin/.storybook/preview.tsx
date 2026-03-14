import type { Preview } from "@storybook/react"
import "../styles/admin.css"
import { withAdminProvider } from "../src/__stories__/storybook-utils"

const preview: Preview = {
	decorators: [withAdminProvider],
	parameters: {
		layout: "fullscreen",
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
}

export default preview
