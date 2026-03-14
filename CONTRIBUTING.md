# Contributing to Gearu

Thanks for your interest in contributing to Gearu. This guide covers everything you need to open issues, submit pull requests, and follow our conventions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Monorepo Structure](#monorepo-structure)
- [Commit Convention](#commit-convention)
- [Scoping Features and Fixes](#scoping-features-and-fixes)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Opening a Pull Request](#opening-a-pull-request)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Releasing](#releasing)

---

## Code of Conduct

Be respectful. Constructive feedback is welcome; personal attacks are not. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Getting Started

```bash
# Clone the repo
git clone https://github.com/eliabejr/gearucms.git
cd gearu

# Install dependencies
pnpm install

# Set up the dev database
cp .env.example .env.local
pnpm db:setup:seed

# Start the dev server
pnpm dev
```

Requirements: Node.js >= 18, pnpm >= 9.

## Monorepo Structure

| Package | Path | Description |
|---------|------|-------------|
| `@gearu/core` | `packages/core` | Schema, plugin system, SEO, database utilities |
| `@gearu/admin` | `packages/admin` | Admin panel UI (framework-agnostic React) |
| `gearu` | `packages/cli` | CLI tool (`create-gearu`, migrations) |
| `@gearu/plugin-analytics` | `packages/plugins/analytics` | Page view tracking and dashboard |
| `@gearu/plugin-leads` | `packages/plugins/leads` | Lead capture forms and management |
| `@gearu/web` | `apps/web` | Marketing website |

Every change should target the correct package. If a bug is in the admin UI, the fix goes in `packages/admin`. If it affects the database schema, it goes in `packages/core`.

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this format:

```
type(scope): description
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `refactor` | Code restructuring without behavior change |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Tooling, deps, CI — no production code change |
| `ci` | CI/CD pipeline changes |
| `build` | Build system or external dependency changes |
| `style` | Code formatting (no logic change) |

### Scopes

Use the package name as scope:

- `core` — `@gearu/core`
- `admin` — `@gearu/admin`
- `cli` — CLI package
- `analytics` — Analytics plugin
- `leads` — Leads plugin
- `web` — Marketing website

Omit scope for changes that span multiple packages.

### Examples

```
feat(admin): add bulk delete for entries
fix(core): prevent duplicate slug generation
refactor(leads): extract form validation into shared util
chore: upgrade drizzle-orm to 0.46
docs: add plugin development guide
```

### Breaking Changes

Append `!` after the type/scope, and add a `BREAKING CHANGE:` footer:

```
feat(core)!: rename defineConfig to createConfig

BREAKING CHANGE: `defineConfig` has been renamed to `createConfig`.
Update your `gearu.config.ts` accordingly.
```

## Scoping Features and Fixes

Before writing code, define the scope clearly:

1. **Identify the affected package(s).** A fix in the admin table component stays in `packages/admin`. A schema migration goes in `packages/core`.

2. **Keep PRs focused.** One feature or fix per PR. If a feature requires changes across `core` and `admin`, that's fine — but don't bundle unrelated fixes.

3. **For features:**
   - Describe the user-facing behavior.
   - List which packages are touched.
   - Note any schema changes (migrations needed).
   - Consider plugin impact — does this change the `GearuPlugin` interface?

4. **For fixes:**
   - Reference the issue number.
   - Describe the root cause.
   - Explain why the fix is correct and minimal.

## Reporting Bugs

Use the **Bug Report** issue template. Include:

- **What happened** — Describe the actual behavior.
- **What you expected** — Describe the correct behavior.
- **Steps to reproduce** — Numbered steps, minimal reproduction.
- **Environment** — Node version, OS, browser (if admin UI), package versions.
- **Logs/screenshots** — Console errors, network failures, screenshots.

A good bug report is reproducible. If we can't reproduce it, we can't fix it.

## Requesting Features

Use the **Feature Request** issue template. Include:

- **Problem** — What are you trying to do that you can't?
- **Proposed solution** — How should it work?
- **Alternatives** — What else did you consider?
- **Scope** — Which package(s) would this affect?

Don't start building a feature without discussing it first. Open an issue, get alignment, then submit a PR.

## Opening a Pull Request

### Before you start

1. Check existing issues and PRs to avoid duplicate work.
2. For non-trivial changes, open an issue first to discuss the approach.
3. Fork the repo and create a branch from `main`.

### Branch naming

```
feat/short-description
fix/short-description
refactor/short-description
```

### PR checklist

- [ ] Branch is up to date with `main`.
- [ ] Commit messages follow the [convention](#commit-convention).
- [ ] Changes are scoped to the correct package(s).
- [ ] Types are correct — no `any` unless absolutely necessary.
- [ ] Admin CSS uses class selectors in `admin.css` — no inline Tailwind utilities.
- [ ] New exports are added to the package's `index.ts`.
- [ ] No `console.log` left in production code.
- [ ] Breaking changes are documented in the commit message footer.

### PR description

Use this structure:

```markdown
## Summary
What changed and why.

## Changes
- List of specific changes.

## Testing
How you verified this works.

## Related Issues
Closes #123
```

### Review process

1. A maintainer will review within 48 hours.
2. Address feedback by pushing new commits (don't force-push during review).
3. Once approved, a maintainer will merge using squash-and-merge.

## Development Workflow

### Building packages

```bash
# Build all packages
pnpm -r build

# Build a specific package
pnpm --filter @gearu/core build

# Watch mode for a package
pnpm --filter @gearu/admin dev
```

### Running the dev server

```bash
pnpm dev          # Starts on http://localhost:3000
```

The admin panel is at `/admin`. You need to sign in — seed data creates a test user (check `scripts/setup-dev-db.ts`).

### Database

```bash
pnpm db:push       # Push schema to dev database
pnpm db:generate   # Generate migration files
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Drizzle Studio
```

### Generating the changelog

```bash
pnpm changelog            # Write CHANGELOG.md
pnpm changelog --dry-run  # Preview without writing
pnpm release 1.5.0        # Tag and generate changelog
```

### Testing

```bash
pnpm test       # Run all tests
```

## Code Style

- **TypeScript** — Strict mode. No implicit `any`.
- **Formatting** — We use [Biome](https://biomejs.dev/). Run `pnpm check` before committing.
- **Naming** — Files use `kebab-case`. Components use `PascalCase`. Functions and variables use `camelCase`.
- **CSS** — The admin package uses plain CSS with BEM-like class names scoped under `.admin-layout`. No Tailwind utilities inside the admin package.
- **Exports** — Every public API must have JSDoc. Re-export from the package's `index.ts`.
- **No default exports** — Use named exports everywhere (except for legacy component files).

## Releasing

Releases are managed by maintainers:

1. Ensure all changes are merged to `main`.
2. Update package versions in each `package.json`.
3. Run `pnpm release <version>` to tag and generate the changelog.
4. Push tags: `git push --tags`.
5. Publish packages: `pnpm -r publish --access public`.

---

Questions? Open a [Discussion](https://github.com/eliabejr/gearucms/discussions) or reach out to [@eliabejr](https://github.com/eliabejr).
