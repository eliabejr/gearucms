import { Check } from "lucide-react";

export function DeveloperExperience() {
  return (
    <section className="section" id="developer-experience">
      <div className="container">
        <div className="dx-grid">
          <div className="dx-content">
            <div className="section-label">Developer Experience</div>
            <h2>Type-safe from database to UI</h2>
            <p>
              Gearu uses Drizzle ORM for schema definition and tRPC for API
              routes. Every query, mutation, and component is fully typed — no
              code generation, no runtime surprises.
            </p>
            <ul className="dx-list">
              <li>
                <Check size={18} />
                Drizzle ORM — type-safe SQL with zero overhead
              </li>
              <li>
                <Check size={18} />
                tRPC — end-to-end type safety, no REST boilerplate
              </li>
              <li>
                <Check size={18} />
                Plugin schemas merge automatically into your database
              </li>
              <li>
                <Check size={18} />
                Works with TanStack Start, Next.js, Remix, or any React setup
              </li>
              <li>
                <Check size={18} />
                SQLite by default — deploy anywhere, no database server needed
              </li>
              <li>
                <Check size={18} />
                Cloudflare D1 compatible for edge deployments
              </li>
            </ul>
          </div>

          <div className="dx-code">
            <pre>
              <span className="comment">{"// gearu.config.ts"}</span>
              {"\n"}
              <span className="keyword">{"import"}</span>
              {" { "}
              <span className="type">{"defineConfig"}</span>
              {" } "}
              <span className="keyword">{"from"}</span>
              {" "}
              <span className="string">{'"@gearu/core"'}</span>
              {"\n"}
              <span className="keyword">{"import"}</span>
              {" { "}
              <span className="type">{"analyticsPlugin"}</span>
              {" } "}
              <span className="keyword">{"from"}</span>
              {" "}
              <span className="string">{'"@gearu/plugin-analytics"'}</span>
              {"\n"}
              <span className="keyword">{"import"}</span>
              {" { "}
              <span className="type">{"leadsPlugin"}</span>
              {" } "}
              <span className="keyword">{"from"}</span>
              {" "}
              <span className="string">{'"@gearu/plugin-leads"'}</span>
              {"\n\n"}
              <span className="keyword">{"export default"}</span>
              {" "}
              <span className="type">{"defineConfig"}</span>
              {"({\n"}
              {"  siteName: "}
              <span className="string">{'"My Website"'}</span>
              {",\n"}
              {"  siteUrl: "}
              <span className="string">{'"https://example.com"'}</span>
              {",\n\n"}
              {"  "}
              <span className="comment">{"// Add plugins you need"}</span>
              {"\n"}
              {"  plugins: [\n"}
              {"    "}
              <span className="type">{"analyticsPlugin"}</span>
              {"(),\n"}
              {"    "}
              <span className="type">{"leadsPlugin"}</span>
              {"(),\n"}
              {"  ],\n"}
              {"})"}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
