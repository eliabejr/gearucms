import { Package } from "lucide-react";

export function Header() {
	return (
		<header className="header">
			<div className="container header-inner">
				<a href="#" className="header-logo">
					<svg
						width="28"
						height="28"
						viewBox="0 0 32 32"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect width="32" height="32" rx="8" fill="#0c0c0c" />
						<path
							d="M8 22V10h3.2v4.8h.1L14.8 10H18l-4 5.2L18.4 22H15l-2.8-5.2-.8 1V22H8Z"
							fill="#fff"
						/>
					</svg>
					Gearu
				</a>

				<nav className="header-nav">
					<a href="#features">Features</a>
					<a href="#plugins">Plugins</a>
					<a href="#developer-experience">For Developers</a>
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
