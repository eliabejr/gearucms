import { Sparkles, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-badge">
          <Sparkles size={14} />
          Open-source headless CMS
        </div>

        <h1>
          Your React app
          <br />
          deserves a <span>real CMS</span>
        </h1>

        <p>
          Gearu installs as a package. Type-safe collections, admin panel, SEO,
          AI-powered content, analytics, and lead capture — ready in minutes.
        </p>

        <div className="hero-actions">
          <a href="#get-started" className="btn btn-primary btn-large">
            Get Started
            <ArrowRight size={16} />
          </a>
          <a
            href="https://github.com/eliabejr/gearu"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-large"
          >
            View on GitHub
          </a>
        </div>

        <div className="hero-code">
          <code>
            <span className="comment">{"# Install Gearu in your React project"}</span>
            <br />
            <span className="keyword">{"pnpm"}</span>{" add "}
            <span className="string">{"@gearu/core @gearu/admin"}</span>
            <br />
            <br />
            <span className="comment">{"# Add plugins you need"}</span>
            <br />
            <span className="keyword">{"pnpm"}</span>{" add "}
            <span className="string">{"@gearu/plugin-analytics @gearu/plugin-leads"}</span>
          </code>
        </div>
      </div>
    </section>
  );
}
