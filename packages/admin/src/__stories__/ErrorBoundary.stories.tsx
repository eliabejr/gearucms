import type { Meta, StoryObj } from "@storybook/react-vite"
import { ModuleErrorBoundary } from "../components/error-boundary"

function HealthyChild() {
	return <div className="island-shell p-5">Module rendered successfully.</div>
}

function BrokenChild() {
	throw new Error("Storybook render failure")
}

const meta = {
	title: "Components/ModuleErrorBoundary",
	component: ModuleErrorBoundary,
	tags: ["autodocs"],
	args: {
		module: "Collections",
	},
} satisfies Meta<typeof ModuleErrorBoundary>

export default meta

type Story = StoryObj<typeof meta>

export const Healthy: Story = {
	render: (args) => (
		<ModuleErrorBoundary {...args}>
			<HealthyChild />
		</ModuleErrorBoundary>
	),
}

export const ErrorState: Story = {
	render: (args) => (
		<ModuleErrorBoundary {...args}>
			<BrokenChild />
		</ModuleErrorBoundary>
	),
}
