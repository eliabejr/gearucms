import type { Meta, StoryObj } from "@storybook/react-vite"
import { LoadingPlaceholder } from "../components/loading-placeholder"

const meta = {
	title: "Components/LoadingPlaceholder",
	component: LoadingPlaceholder,
	tags: ["autodocs"],
} satisfies Meta<typeof LoadingPlaceholder>

export default meta

type Story = StoryObj<typeof meta>

export const Page: Story = {
	args: {
		variant: "page",
	},
}

export const Table: Story = {
	args: {
		variant: "table",
	},
}

export const Form: Story = {
	args: {
		variant: "form",
	},
}
