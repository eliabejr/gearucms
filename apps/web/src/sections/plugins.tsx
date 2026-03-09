import { BarChart3, Users, Check } from "lucide-react";

export function Plugins() {
  return (
    <section className="section section-dark" id="plugins">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Plugin System</div>
          <h2>Extend with plugins</h2>
          <p>
            Add capabilities without bloating your core. Each plugin brings its
            own schema, API routes, and admin UI.
          </p>
        </div>

        <div className="plugins-grid">
          <div className="plugin-card">
            <div className="plugin-badge plugin-badge-analytics">
              <BarChart3 size={13} />
              @gearu/plugin-analytics
            </div>
            <h3>Analytics</h3>
            <p>
              Track page views, traffic sources, and UTM campaigns. Visual
              dashboard with daily trends — no third-party scripts required.
            </p>
            <ul className="plugin-features">
              <li>
                <Check size={16} />
                Page view tracking with auto-capture
              </li>
              <li>
                <Check size={16} />
                Top pages and traffic sources
              </li>
              <li>
                <Check size={16} />
                Full UTM campaign tracking
              </li>
              <li>
                <Check size={16} />
                Daily view trends chart
              </li>
              <li>
                <Check size={16} />
                Country and user agent detection
              </li>
            </ul>
          </div>

          <div className="plugin-card">
            <div className="plugin-badge plugin-badge-leads">
              <Users size={13} />
              @gearu/plugin-leads
            </div>
            <h3>Leads</h3>
            <p>
              Build dynamic forms, capture leads, and track conversions. Full
              UTM attribution links every lead to its source.
            </p>
            <ul className="plugin-features">
              <li>
                <Check size={16} />
                Dynamic form builder with 7 field types
              </li>
              <li>
                <Check size={16} />
                Server-side validation
              </li>
              <li>
                <Check size={16} />
                UTM and referrer attribution
              </li>
              <li>
                <Check size={16} />
                Lead management dashboard
              </li>
              <li>
                <Check size={16} />
                CSV export
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
