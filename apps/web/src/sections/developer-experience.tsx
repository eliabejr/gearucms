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
                <code>createDb</code> — merges core + plugin schemas into one Drizzle instance
              </li>
              <li>
                <Check size={18} />
                <code>createGearuTRPC</code> — generates typed procedures with auth middleware
              </li>
              <li>
                <Check size={18} />
                <code>createGearuRouterRecord</code> — wires all core routes in one call
              </li>
              <li>
                <Check size={18} />
                Plugin routers merge with a single spread
              </li>
              <li>
                <Check size={18} />
                SQLite by default — deploy anywhere, no database server needed
              </li>
              <li>
                <Check size={18} />
                Works with TanStack Start, Next.js, Remix, or any React setup
              </li>
            </ul>
          </div>

          <div className="dx-code">
            <pre>
              <span className="comment">{"// src/trpc/router.ts"}</span>
              {"\n"}
              <span className="keyword">{"import"}</span>
              {" { "}
              <span className="type">{"createGearuTRPC"}</span>
              {", "}
              <span className="type">{"createGearuRouterRecord"}</span>
              {" }\n  "}
              <span className="keyword">{"from"}</span>
              {" "}
              <span className="string">{'"@gearu/core/trpc"'}</span>
              {"\n"}
              <span className="keyword">{"import"}</span>
              {" { "}
              <span className="type">{"createAnalyticsRouter"}</span>
              {" }\n  "}
              <span className="keyword">{"from"}</span>
              {" "}
              <span className="string">{'"@gearu/plugin-analytics"'}</span>
              {"\n"}
              <span className="keyword">{"import"}</span>
              {" { "}
              <span className="type">{"createLeadsRouter"}</span>
              {" }\n  "}
              <span className="keyword">{"from"}</span>
              {" "}
              <span className="string">{'"@gearu/plugin-leads"'}</span>
              {"\n\n"}
              <span className="keyword">{"const"}</span>
              {" { createTRPCRouter, publicProcedure,\n  protectedProcedure, TRPCError } =\n  "}
              <span className="type">{"createGearuTRPC"}</span>
              {"()\n\n"}
              <span className="keyword">{"const"}</span>
              {" ctx = { db, publicProcedure,\n  protectedProcedure, TRPCError }\n\n"}
              <span className="keyword">{"export const"}</span>
              {" appRouter = "}
              <span className="type">{"createTRPCRouter"}</span>
              {"({\n"}
              {"  ..."}
              <span className="type">{"createGearuRouterRecord"}</span>
              {"(ctx),\n"}
              {"  ..."}
              <span className="type">{"createAnalyticsRouter"}</span>
              {"(ctx),\n"}
              {"  ..."}
              <span className="type">{"createLeadsRouter"}</span>
              {"(ctx),\n"}
              {"})"}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
