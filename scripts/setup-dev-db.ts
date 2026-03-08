#!/usr/bin/env tsx
/**
 * Development-only database setup script
 *
 * Checks if a local SQLite database exists, and if not:
 * 1. Creates the database file
 * 2. Runs Drizzle schema push to create all tables
 * 3. Optionally seeds initial data (admin user, default settings)
 *
 * Usage:
 *   pnpm db:setup
 *   pnpm db:setup --seed    (also seeds sample data)
 *   pnpm db:setup --reset   (drops and recreates everything)
 */

import { existsSync, unlinkSync } from "node:fs"
import { resolve } from "node:path"
import { execSync } from "node:child_process"
import { config } from "dotenv"

// Load environment variables
config({ path: [".env.local", ".env"] })

const DB_URL = process.env.DATABASE_URL || "dev.db"
const dbPath = resolve(process.cwd(), DB_URL)
const args = process.argv.slice(2)
const shouldSeed = args.includes("--seed")
const shouldReset = args.includes("--reset")

function log(msg: string) {
	console.log(`\x1b[36m[db:setup]\x1b[0m ${msg}`)
}

function success(msg: string) {
	console.log(`\x1b[32m[db:setup]\x1b[0m ✓ ${msg}`)
}

function warn(msg: string) {
	console.log(`\x1b[33m[db:setup]\x1b[0m ⚠ ${msg}`)
}

function error(msg: string) {
	console.error(`\x1b[31m[db:setup]\x1b[0m ✗ ${msg}`)
}

async function main() {
	log(`Database path: ${dbPath}`)

	// ─── Reset mode ─────────────────────────────────────────
	if (shouldReset) {
		if (existsSync(dbPath)) {
			warn("Removing existing database...")
			unlinkSync(dbPath)
			success("Database removed")
		}
	}

	// ─── Check if database exists ───────────────────────────
	const dbExists = existsSync(dbPath)

	if (dbExists && !shouldReset) {
		log("Database already exists. Checking for pending migrations...")

		try {
			execSync("npx drizzle-kit push --force", {
				stdio: "inherit",
				cwd: process.cwd(),
				env: { ...process.env, DATABASE_URL: DB_URL },
			})
			success("Schema is up to date")
		} catch {
			error("Failed to push schema updates")
			process.exit(1)
		}

		if (shouldSeed) {
			await seedDatabase()
		}

		return
	}

	// ─── Create new database ────────────────────────────────
	log("No database found. Creating new database...")

	try {
		// Generate migrations from schema
		log("Generating migrations from schema...")
		execSync("npx drizzle-kit generate", {
			stdio: "inherit",
			cwd: process.cwd(),
			env: { ...process.env, DATABASE_URL: DB_URL },
		})
		success("Migrations generated")

		// Push schema to create tables
		log("Pushing schema to database...")
		execSync("npx drizzle-kit push --force", {
			stdio: "inherit",
			cwd: process.cwd(),
			env: { ...process.env, DATABASE_URL: DB_URL },
		})
		success("Database tables created")
	} catch (e) {
		error(`Failed to create database: ${e}`)
		process.exit(1)
	}

	// ─── Seed default data ──────────────────────────────────
	if (shouldSeed) {
		await seedDatabase()
	}

	success("Database setup complete!")
	log(`  Database file: ${dbPath}`)
	log(`  Run 'pnpm dev' to start the development server`)
}

async function seedDatabase() {
	log("Seeding database with default data...")

	try {
		// Dynamic import to ensure schema is available after push
		const Database = (await import("better-sqlite3")).default
		const db = new Database(dbPath)

		// ─── Default site settings ──────────────────────────
		const settingsStmt = db.prepare(
			"INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, unixepoch())",
		)

		const defaultSettings: Record<string, string> = {
			site_name: "My CMS",
			site_description: "A modern content management system",
			site_url: "http://localhost:3000",
			ai_default_provider: "anthropic",
			ai_default_model: "claude-sonnet-4-20250514",
		}

		for (const [key, value] of Object.entries(defaultSettings)) {
			settingsStmt.run(key, value)
		}
		success("Default site settings created")

		// ─── Sample collection ──────────────────────────────
		const collectionResult = db
			.prepare(
				"INSERT INTO collections (name, slug, description, created_at) VALUES (?, ?, ?, unixepoch())",
			)
			.run("Blog Posts", "blog", "Blog articles and news")

		const collectionId = collectionResult.lastInsertRowid

		// ─── Sample fields ──────────────────────────────────
		const fieldStmt = db.prepare(
			"INSERT INTO collection_fields (collection_id, name, slug, type, required, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
		)

		fieldStmt.run(collectionId, "Content", "content", "richtext", 1, 0)
		fieldStmt.run(collectionId, "Featured Image", "featured_image", "image", 0, 1)
		fieldStmt.run(collectionId, "Excerpt", "excerpt", "text", 0, 2)

		success("Sample 'Blog Posts' collection created with fields")

		db.close()
		success("Database seeded successfully")
	} catch (e) {
		error(`Failed to seed database: ${e}`)
		warn("You can manually seed the database later via the admin panel")
	}
}

main().catch((e) => {
	error(`Unexpected error: ${e}`)
	process.exit(1)
})
