import { Package } from "lucide-react";

export function Header() {
	return (
		<header className="header">
			<div className="container header-inner">
				<a href="/" className="header-logo">
					<img src="/favicon.svg" alt="" width="28" height="28" />
					Gearu
				</a>

				<nav className="header-nav">
					<a href="#features">Features</a>
					<a href="#plugins">Plugins</a>
					<a href="#installation">Install</a>
					<a
						href="https://github.com/eliabejr/gearucms"
						target="_blank"
						rel="noopener noreferrer"
					>
						GitHub
					</a>
				</nav>

				<div className="header-actions">
					<a
						href="https://www.npmjs.com/package/@gearu/core"
						target="_blank"
						rel="noopener noreferrer"
						className="btn btn-secondary"
					>
						<Package size={15} />
						npm
					</a>
					<a href="#get-started" className="btn btn-primary">
						Get Started
					</a>
				</div>
			</div>
		</header>
	);
}
