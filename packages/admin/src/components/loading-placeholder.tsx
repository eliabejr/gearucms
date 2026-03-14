/** Shimmer skeleton placeholders for loading states. */

interface LoadingPlaceholderProps {
	/** Preset layout: "page" (heading + cards), "table" (heading + rows), "form" (fields) */
	variant?: "page" | "table" | "form"
}

/** Renders a shimmer skeleton matching the given layout variant. */
export function LoadingPlaceholder({ variant = "page" }: LoadingPlaceholderProps) {
	if (variant === "table") {
		return (
			<div>
				<div className="admin-skeleton admin-skeleton-heading" />
				{Array.from({ length: 6 }, (_, i) => (
					<div key={i} className="admin-skeleton admin-skeleton-row" />
				))}
			</div>
		)
	}

	if (variant === "form") {
		return (
			<div>
				<div className="admin-skeleton admin-skeleton-heading" />
				{Array.from({ length: 4 }, (_, i) => (
					<div key={i} style={{ marginBottom: "1.5rem" }}>
						<div className="admin-skeleton" style={{ height: 12, width: "20%", marginBottom: 8 }} />
						<div className="admin-skeleton" style={{ height: 38 }} />
					</div>
				))}
			</div>
		)
	}

	return (
		<div>
			<div className="admin-skeleton admin-skeleton-heading" />
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
				{Array.from({ length: 3 }, (_, i) => (
					<div key={i} className="admin-skeleton admin-skeleton-card" />
				))}
			</div>
			<div style={{ marginTop: "2rem" }}>
				<div className="admin-skeleton admin-skeleton-text" />
				<div className="admin-skeleton admin-skeleton-text" />
				<div className="admin-skeleton admin-skeleton-text" />
			</div>
		</div>
	)
}
