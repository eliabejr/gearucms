#!/usr/bin/env tsx
/**
 * Changelog generator for Gearu CMS.
 *
 * Reads git history, groups commits by version tags, and categorizes them
 * using conventional commit prefixes (feat, fix, refactor, chore, etc.).
 *
 * Usage:
 *   pnpm changelog              # Generate CHANGELOG.md
 *   pnpm changelog --tag 1.4.0  # Tag current HEAD and regenerate
 *   pnpm changelog --dry-run    # Print to stdout without writing
 */

import { execSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

const ROOT = resolve(import.meta.dirname, "..")
const CHANGELOG_PATH = resolve(ROOT, "CHANGELOG.md")

interface Commit {
	hash: string
	subject: string
	body: string
	date: string
}

interface ParsedCommit {
	hash: string
	type: string
	scope: string | null
	subject: string
	breaking: boolean
	date: string
}

interface VersionGroup {
	tag: string
	date: string
	commits: ParsedCommit[]
}

const CATEGORY_ORDER = [
	"breaking",
	"feat",
	"fix",
	"refactor",
	"perf",
	"chore",
	"docs",
	"test",
	"ci",
	"build",
	"style",
	"other",
] as const

const CATEGORY_LABELS: Record<string, string> = {
	breaking: "Breaking Changes",
	feat: "Features",
	fix: "Bug Fixes",
	refactor: "Refactoring",
	perf: "Performance",
	chore: "Chores",
	docs: "Documentation",
	test: "Tests",
	ci: "CI/CD",
	build: "Build",
	style: "Code Style",
	other: "Other",
}

function git(cmd: string): string {
	return execSync(`git ${cmd}`, { cwd: ROOT, encoding: "utf-8" }).trim()
}

function getTags(): { tag: string; hash: string; date: string }[] {
	try {
		const raw = git(
			'tag -l --sort=-version:refname --format="%(refname:short)|%(objectname:short)|%(creatordate:short)"',
		)
		if (!raw) return []
		return raw
			.split("\n")
			.filter(Boolean)
			.map((line) => {
				const [tag, hash, date] = line.split("|")
				return { tag: tag!, hash: hash!, date: date! }
			})
	} catch {
		return []
	}
}

function getCommits(from?: string, to = "HEAD"): Commit[] {
	const range = from ? `${from}..${to}` : to
	const sep = "---GEARU_COMMIT_SEP---"
	const fieldSep = "---GEARU_FIELD_SEP---"
	try {
		const raw = git(
			`log ${range} --format="${sep}%H${fieldSep}%s${fieldSep}%b${fieldSep}%as" --no-merges`,
		)
		if (!raw) return []
		return raw
			.split(sep)
			.filter(Boolean)
			.map((chunk) => {
				const [hash, subject, body, date] = chunk.split(fieldSep)
				return {
					hash: hash!.trim().slice(0, 7),
					subject: subject!.trim(),
					body: body!.trim(),
					date: date!.trim(),
				}
			})
	} catch {
		return []
	}
}

const COMMIT_RE = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/

function parseCommit(commit: Commit): ParsedCommit {
	const match = commit.subject.match(COMMIT_RE)
	if (!match) {
		return {
			hash: commit.hash,
			type: "other",
			scope: null,
			subject: commit.subject,
			breaking: false,
			date: commit.date,
		}
	}

	const [, type, scope, bang, subject] = match
	const breaking =
		!!bang ||
		commit.body.includes("BREAKING CHANGE") ||
		commit.body.includes("BREAKING-CHANGE")

	return {
		hash: commit.hash,
		type: type!.toLowerCase(),
		scope: scope ?? null,
		subject: subject!,
		breaking,
		date: commit.date,
	}
}

function groupByVersion(tags: { tag: string; hash: string; date: string }[]): VersionGroup[] {
	const groups: VersionGroup[] = []

	// Unreleased: commits after the latest tag
	const latestTag = tags[0]
	const unreleasedCommits = getCommits(latestTag?.tag).map(parseCommit)
	if (unreleasedCommits.length > 0) {
		groups.push({
			tag: "Unreleased",
			date: new Date().toISOString().split("T")[0]!,
			commits: unreleasedCommits,
		})
	}

	// Tagged versions
	for (let i = 0; i < tags.length; i++) {
		const current = tags[i]!
		const previous = tags[i + 1]
		const commits = getCommits(previous?.tag, current.tag).map(parseCommit)
		if (commits.length > 0) {
			groups.push({
				tag: current.tag,
				date: current.date,
				commits,
			})
		}
	}

	// If no tags at all, everything is "Unreleased"
	if (tags.length === 0 && groups.length === 0) {
		const allCommits = getCommits().map(parseCommit)
		if (allCommits.length > 0) {
			groups.push({
				tag: "Unreleased",
				date: new Date().toISOString().split("T")[0]!,
				commits: allCommits,
			})
		}
	}

	return groups
}

function formatCommit(c: ParsedCommit): string {
	const scope = c.scope ? `**${c.scope}:** ` : ""
	return `- ${scope}${c.subject} (\`${c.hash}\`)`
}

function renderChangelog(groups: VersionGroup[]): string {
	const lines: string[] = [
		"# Changelog",
		"",
		"All notable changes to Gearu CMS are documented in this file.",
		"Format follows [Conventional Commits](https://www.conventionalcommits.org/).",
		"",
	]

	for (const group of groups) {
		lines.push(`## ${group.tag === "Unreleased" ? "Unreleased" : `${group.tag}`} — ${group.date}`)
		lines.push("")

		// Separate breaking changes
		const breaking = group.commits.filter((c) => c.breaking)
		const regular = group.commits.filter((c) => !c.breaking)

		// Group by category
		const byCategory = new Map<string, ParsedCommit[]>()
		if (breaking.length > 0) {
			byCategory.set("breaking", breaking)
		}
		for (const commit of regular) {
			const key = CATEGORY_LABELS[commit.type] ? commit.type : "other"
			const existing = byCategory.get(key) ?? []
			existing.push(commit)
			byCategory.set(key, existing)
		}

		for (const cat of CATEGORY_ORDER) {
			const commits = byCategory.get(cat)
			if (!commits || commits.length === 0) continue
			lines.push(`### ${CATEGORY_LABELS[cat]}`)
			lines.push("")
			for (const c of commits) {
				lines.push(formatCommit(c))
			}
			lines.push("")
		}
	}

	return lines.join("\n")
}

// ── CLI ──

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const tagIndex = args.indexOf("--tag")
const newTag = tagIndex !== -1 ? args[tagIndex + 1] : null

if (newTag) {
	console.log(`Tagging HEAD as ${newTag}...`)
	git(`tag ${newTag}`)
	console.log(`Tagged ${newTag}`)
}

const tags = getTags()
const groups = groupByVersion(tags)
const output = renderChangelog(groups)

if (dryRun) {
	console.log(output)
} else {
	writeFileSync(CHANGELOG_PATH, output, "utf-8")
	console.log(`Wrote ${CHANGELOG_PATH}`)
	console.log(`${groups.length} version(s), ${groups.reduce((n, g) => n + g.commits.length, 0)} commit(s)`)
}
