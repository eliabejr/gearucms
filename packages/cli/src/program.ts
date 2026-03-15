import { Command } from "commander"
import { createIntegerParser } from "./lib/parsers"

const parseCollectionId = createIntegerParser("collection id")
const parseEntryId = createIntegerParser("entry id")
const parseLimit = createIntegerParser("limit")
const parseOffset = createIntegerParser("offset")

export function createCliProgram(version: string) {
  const program = new Command()
  program
    .name("gearu")
    .description("Gearu CMS CLI")
    .version(version)
    .showHelpAfterError()

  program
    .command("init")
    .description("Create gearu.config.ts and ensure admin route exists")
    .action(async () => {
      const { init } = await import("./commands/init.js")
      await init()
    })

  program
    .command("migrate")
    .description("Generate and apply migrations (core + plugins)")
    .option("--dry-run", "Only generate, do not apply")
    .action(async (opts: { dryRun?: boolean }) => {
      const { migrate } = await import("./commands/migrate.js")
      await migrate(opts)
    })

  program
    .command("upgrade")
    .description("Check for updates and optionally run migrations")
    .action(async () => {
      const { upgrade } = await import("./commands/upgrade.js")
      await upgrade()
    })

  const collections = program
    .command("collections")
    .description("List, inspect, and mutate collections")

  collections
    .command("list")
    .description("List all collections")
    .option("--json", "Print machine-readable JSON output")
    .action(async (opts: { json?: boolean }) => {
      const { listCollections } = await import("./commands/collections.js")
      await listCollections(opts)
    })

  collections
    .command("get")
    .description("Get one collection by id")
    .argument("<id>", "Collection id", parseCollectionId)
    .option("--json", "Print machine-readable JSON output")
    .action(async (id: number, opts: { json?: boolean }) => {
      const { getCollection } = await import("./commands/collections.js")
      await getCollection(id, opts)
    })

  collections
    .command("create")
    .description("Create a collection")
    .requiredOption("--name <name>", "Collection name")
    .option("--slug <slug>", "Collection slug")
    .option("--description <description>", "Collection description")
    .option("--json", "Print machine-readable JSON output")
    .action(async (opts: { name: string; slug?: string; description?: string; json?: boolean }) => {
      const { createCollection } = await import("./commands/collections.js")
      await createCollection(opts)
    })

  collections
    .command("update")
    .description("Update a collection")
    .argument("<id>", "Collection id", parseCollectionId)
    .option("--name <name>", "Collection name")
    .option("--slug <slug>", "Collection slug")
    .option("--description <description>", "Collection description")
    .option("--json", "Print machine-readable JSON output")
    .action(async (id: number, opts: { name?: string; slug?: string; description?: string; json?: boolean }) => {
      const { updateCollection } = await import("./commands/collections.js")
      await updateCollection(id, opts)
    })

  collections
    .command("delete")
    .description("Delete a collection")
    .argument("<id>", "Collection id", parseCollectionId)
    .option("--json", "Print machine-readable JSON output")
    .action(async (id: number, opts: { json?: boolean }) => {
      const { deleteCollection } = await import("./commands/collections.js")
      await deleteCollection(id, opts)
    })

  const entries = program
    .command("entries")
    .description("List, inspect, and mutate entries")

  entries
    .command("list")
    .description("List entries")
    .option("--collection-id <id>", "Filter by collection id", parseCollectionId)
    .option("--status <status>", "Filter by status (draft, published, archived)")
    .option("--limit <limit>", "Max entries to return", parseLimit)
    .option("--offset <offset>", "Skip the first N entries", parseOffset)
    .option("--json", "Print machine-readable JSON output")
    .action(async (opts: {
      collectionId?: number
      status?: "draft" | "published" | "archived"
      limit?: number
      offset?: number
      json?: boolean
    }) => {
      const { listEntries } = await import("./commands/entries.js")
      await listEntries(opts)
    })

  entries
    .command("get")
    .description("Get one entry by id")
    .argument("<id>", "Entry id", parseEntryId)
    .option("--json", "Print machine-readable JSON output")
    .action(async (id: number, opts: { json?: boolean }) => {
      const { getEntry } = await import("./commands/entries.js")
      await getEntry(id, opts)
    })

  entries
    .command("create")
    .description("Create an entry")
    .requiredOption("--collection-id <id>", "Collection id", parseCollectionId)
    .requiredOption("--title <title>", "Entry title")
    .option("--slug <slug>", "Entry slug")
    .option("--status <status>", "Entry status (draft or published)")
    .option("--meta-title <metaTitle>", "SEO meta title")
    .option("--meta-description <metaDescription>", "SEO meta description")
    .option("--og-image <url>", "Open Graph image URL")
    .option("--fields <json>", "JSON array of { fieldId, value } objects")
    .option("--json", "Print machine-readable JSON output")
    .action(async (opts: {
      collectionId: number
      title: string
      slug?: string
      status?: "draft" | "published"
      metaTitle?: string
      metaDescription?: string
      ogImage?: string
      fields?: string
      json?: boolean
    }) => {
      const { createEntry } = await import("./commands/entries.js")
      await createEntry(opts)
    })

  entries
    .command("update")
    .description("Update an entry")
    .argument("<id>", "Entry id", parseEntryId)
    .option("--title <title>", "Entry title")
    .option("--slug <slug>", "Entry slug")
    .option("--status <status>", "Entry status (draft, published, archived)")
    .option("--meta-title <metaTitle>", "SEO meta title, or `null` to clear it")
    .option("--meta-description <metaDescription>", "SEO meta description, or `null` to clear it")
    .option("--og-image <url>", "Open Graph image URL, or `null` to clear it")
    .option("--fields <json>", "JSON array of { fieldId, value } objects")
    .option("--json", "Print machine-readable JSON output")
    .action(async (id: number, opts: {
      title?: string
      slug?: string
      status?: "draft" | "published" | "archived"
      metaTitle?: string
      metaDescription?: string
      ogImage?: string
      fields?: string
      json?: boolean
    }) => {
      const { updateEntry } = await import("./commands/entries.js")
      await updateEntry(id, opts)
    })

  entries
    .command("delete")
    .description("Delete an entry")
    .argument("<id>", "Entry id", parseEntryId)
    .option("--json", "Print machine-readable JSON output")
    .action(async (id: number, opts: { json?: boolean }) => {
      const { deleteEntry } = await import("./commands/entries.js")
      await deleteEntry(id, opts)
    })

  return program
}
