import { Component, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
	/** Module name shown in the error message */
	module: string
	children: ReactNode
}

interface ErrorBoundaryState {
	error: Error | null
}

/** Catches rendering errors within a module and displays a recovery UI. */
export class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: null }

	static getDerivedStateFromError(error: Error) {
		return { error }
	}

	handleRetry = () => {
		this.setState({ error: null })
	}

	render() {
		if (this.state.error) {
			return (
				<div className="admin-error">
					<div className="admin-error-icon">
						<AlertTriangle size={22} />
					</div>
					<h3>Something went wrong in {this.props.module}</h3>
					<p>
						An unexpected error occurred while rendering this module.
						Try again or contact support if the issue persists.
					</p>
					<button type="button" className="btn-primary" onClick={this.handleRetry}>
						Try Again
					</button>
					<details>
						<summary>Error details</summary>
						<pre>{this.state.error.message}{"\n"}{this.state.error.stack}</pre>
					</details>
				</div>
			)
		}

		return this.props.children
	}
}
