import {
  Layers,
  FileText,
  Image,
  MessageSquare,
  History,
  Search,
  Sparkles,
  Settings,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: <Layers size={20} />,
    title: "Collections",
    description:
      "Define content types with 7 field types — text, rich text, number, boolean, image, relation, and date. Fully type-safe with Drizzle ORM.",
  },
  {
    icon: <FileText size={20} />,
    title: "Entries",
    description:
      "Create, edit, and publish content with draft/publish workflow. Bulk operations, filtering, and full-text search out of the box.",
  },
  {
    icon: <Image size={20} />,
    title: "Media Manager",
    description:
      "Drag-and-drop uploads with automatic metadata extraction. Organize images and files with a built-in media library.",
  },
  {
    icon: <MessageSquare size={20} />,
    title: "Comments",
    description:
      "Built-in comment system with moderation. Approve, reject, or hold comments for review with threaded conversations.",
  },
  {
    icon: <History size={20} />,
    title: "Content Versioning",
    description:
      "Every edit creates a snapshot. Browse full revision history, compare versions, and restore any previous state instantly.",
  },
  {
    icon: <Search size={20} />,
    title: "SEO Toolkit",
    description:
      "Auto-generated meta tags, JSON-LD, sitemaps, robots.txt, and OG images. Built-in SEO scoring to optimize every page.",
  },
  {
    icon: <Sparkles size={20} />,
    title: "AI Writer",
    description:
      "Generate articles in bulk from CSV. Configure your AI provider, model, and system prompt. Supports image generation from multiple sources.",
  },
  {
    icon: <Settings size={20} />,
    title: "Site Settings",
    description:
      "Manage site metadata, AI provider keys, and tracking scripts from the admin panel. No code changes needed for configuration.",
  },
  {
    icon: <Shield size={20} />,
    title: "Authentication",
    description:
      "Powered by Better Auth. Secure admin access with session-based authentication and protected API routes via tRPC middleware.",
  },
];

export function Features() {
  return (
    <section className="section section-alt" id="features">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Core Features</div>
          <h2>Everything you need to manage content</h2>
          <p>
            A complete CMS that works as a package in your project — no external
            services, no vendor lock-in.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
