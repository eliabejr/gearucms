import { useState, type ComponentProps } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import Select from "../components/select"

const meta = {
	title: "Components/Select",
	component: Select,
	tags: ["autodocs"],
	args: {
		placeholder: "Choose an option",
		options: [
			{ value: "draft", label: "Draft" },
			{ value: "published", label: "Published" },
			{ value: "archived", label: "Archived" },
		],
	},
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

function StatefulSelect(args: ComponentProps<typeof Select>) {
	const [value, setValue] = useState(args.value ?? "")
	return <Select {...args} value={value} onChange={setValue} />
}

export const Default: Story = {
	render: (args) => <StatefulSelect {...args} />,
}

export const Small: Story = {
	args: {
		size: "sm",
		value: "draft",
	},
	render: (args) => <StatefulSelect {...args} />,
}

export const ClearableDisabled: Story = {
	args: {
		isClearable: true,
		disabled: true,
		value: "published",
	},
	render: (args) => <StatefulSelect {...args} />,
}
