export function Installation() {
	return (
		<section className="section" id="installation">
			<div className="container">
				<div className="section-header">
					<div className="section-label">Quick Start</div>
					<h2>Up and running in 3 steps</h2>
					<p>
						Install the packages, wire up the database and tRPC, and mount the
						admin panel. That's it.
					</p>
				</div>

				<div className="install-steps">
					<div className="install-step">
						<div className="install-step-number">1</div>
						<div className="install-step-content">
							<h3>Set up the database</h3>
							<p>
								<code>createDb</code> merges core tables and plugin schemas into
								a single Drizzle ORM instance. SQLite by default — no database
								server needed.
							</p>
							<div className="install-code">
								<pre>
									<span className="keyword">{"import"}</span>
									{" { "}
									<span className="type">{"createDb"}</span>
									{" } "}
									<span className="keyword">{"from"}</span>
									{" "}
									<span className="string">{'"@gearu/core"'}</span>
									{"\n"}
									<span className="keyword">{"import"}</span>
									{" "}
									<span className="type">{"analyticsPlugin"}</span>
									{" "}
									<span className="keyword">{"from"}</span>
									{" "}
									<span className="string">{'"@gearu/plugin-analytics"'}</span>
									{"\n\n"}
									<span className="keyword">{"const"}</span>
									{" db = "}
									<span className="type">{"createDb"}</span>
									{"(sqlite, {\n"}
									{"  plugins: ["}
									<span className="type">{"analyticsPlugin"}</span>
									{", "}
									<span className="type">{"leadsPlugin"}</span>
									{"],\n"}
									{"})"}
								</pre>
							</div>
						</div>
					</div>

					<div className="install-step">
						<div className="install-step-number">2</div>
						<div className="install-step-content">
							<h3>Wire tRPC routers</h3>
							<p>
								<code>createGearuTRPC</code> generates typed procedures with
								auth middleware. Spread core and plugin routers into one call.
							</p>
							<div className="install-code">
								<pre>
									<span className="keyword">{"import"}</span>
									{" { "}
									<span className="type">{"createGearuTRPC"}</span>
									{",\n  "}
									<span className="type">{"createGearuRouterRecord"}</span>
									{" } "}
									<span className="keyword">{"from"}</span>
									{" "}
									<span className="string">{'"@gearu/core/trpc"'}</span>
									{"\n\n"}
									<span className="keyword">{"const"}</span>
									{" { createTRPCRouter,\n  publicProcedure, protectedProcedure } =\n  "}
									<span className="type">{"createGearuTRPC"}</span>
									{"()\n\n"}
									<span className="keyword">{"export const"}</span>
									{" appRouter = "}
									<span className="type">{"createTRPCRouter"}</span>
									{"({\n  ..."}
									<span className="type">{"createGearuRouterRecord"}</span>
									{"(ctx),\n})"}
								</pre>
							</div>
						</div>
					</div>

					<div className="install-step">
						<div className="install-step-number">3</div>
						<div className="install-step-content">
							<h3>Mount the admin panel</h3>
							<p>
								<code>GearuAdmin</code> renders the full admin UI. Pass your
								router, session, and plugins — one component, zero config.
							</p>
							<div className="install-code">
								<pre>
									<span className="keyword">{"import"}</span>
									{" { "}
									<span className="type">{"GearuAdmin"}</span>
									{" } "}
									<span className="keyword">{"from"}</span>
									{" "}
									<span className="string">{'"@gearu/admin"'}</span>
									{"\n"}
									<span className="keyword">{"import"}</span>
									{" "}
									<span className="string">{'"@gearu/admin/styles.css"'}</span>
									{"\n\n"}
									{"<"}
									<span className="type">{"GearuAdmin"}</span>
									{"\n"}
									{"  pathname={pathname}\n"}
									{"  basePath="}
									<span className="string">{'"admin"'}</span>
									{"\n"}
									{"  plugins={[analyticsPlugin, leadsPlugin]}\n"}
									{"  useTRPC={useTRPC}\n"}
									{"  session={session}\n"}
									{"/>"}
								</pre>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
