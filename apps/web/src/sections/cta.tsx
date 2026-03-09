import { ArrowRight } from "lucide-react";

export function CTA() {
	return (
		<section className="cta" id="get-started">
			<div className="container">
				<div className="cta-inner">
					<h2>Start building with Gearu</h2>
					<p>
						Install the packages, define your collections, and ship a
						production-ready CMS in minutes.
					</p>
					<div className="cta-actions">
						<a
							href="https://github.com/eliabejr/gearucms#readme"
							target="_blank"
							rel="noopener noreferrer"
							className="btn btn-primary btn-large"
						>
							Read the Docs
							<ArrowRight size={16} />
						</a>
						<a
							href="https://github.com/eliabejr/gearucms"
							target="_blank"
							rel="noopener noreferrer"
							className="btn btn-outline btn-large"
						>
							View Source
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
