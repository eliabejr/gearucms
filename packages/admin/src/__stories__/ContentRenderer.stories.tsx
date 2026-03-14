import type { Meta, StoryObj } from "@storybook/react-vite"
import ContentRenderer from "../components/content-renderer"

const meta = {
	title: "Components/ContentRenderer",
	component: ContentRenderer,
	tags: ["autodocs"],
} satisfies Meta<typeof ContentRenderer>

export default meta

type Story = StoryObj<typeof meta>

export const MixedFields: Story = {
	args: {
		fields: [
			{ field: { name: "Title", slug: "title", type: "text" }, value: "Gearu CMS" },
			{ field: { name: "Body", slug: "body", type: "richtext" }, value: "<p>A rich text body with <strong>formatting</strong>.</p>" },
			{ field: { name: "Cover", slug: "cover", type: "image" }, value: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80" },
			{ field: { name: "Views", slug: "views", type: "number" }, value: "1240" },
			{ field: { name: "Published", slug: "publishedAt", type: "date" }, value: "2026-03-14T10:00:00.000Z" },
			{ field: { name: "Feature Flag", slug: "featured", type: "boolean" }, value: "true" },
		],
	},
}

export const TextOnly: Story = {
	args: {
		fields: [
			{ field: { name: "Heading", slug: "heading", type: "text" }, value: "A simple heading" },
			{ field: { name: "Summary", slug: "summary", type: "text" }, value: "Short plain text content for a lighter preview." },
		],
	},
}
