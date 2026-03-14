import type { Meta, StoryObj } from "@storybook/react-vite"
import SeoAnalyzer from "../components/seo-analyzer"

const meta = {
	title: "Components/SeoAnalyzer",
	component: SeoAnalyzer,
	tags: ["autodocs"],
} satisfies Meta<typeof SeoAnalyzer>

export default meta

type Story = StoryObj<typeof meta>

export const GoodScore: Story = {
	args: {
		title: "A polished and search-friendly article title for launch day",
		metaDescription:
			"This description is long enough to sit comfortably in the recommended range while clearly explaining the article's value to readers.",
		content: `<h2>Overview</h2><p>${"word ".repeat(320)}</p><h3>Details</h3><a href="/docs">Docs</a>`,
		slug: "launch-day-article",
		hasImage: true,
	},
}

export const WarningScore: Story = {
	args: {
		title: "Needs work",
		metaDescription: "Short summary",
		content: `<h2>Overview</h2><p>${"word ".repeat(120)}</p>`,
		slug: "needs_work",
		hasImage: false,
	},
}

export const PoorScore: Story = {
	args: {
		title: "Bad",
		metaDescription: "",
		content: "<p>tiny</p>",
		slug: "bad",
		hasImage: false,
	},
}
