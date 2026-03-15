import Database from "better-sqlite3"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { seedCollection, seedCollectionField } from "../../../tests/helpers/test-db"
import { createCliProgram } from "./program"

const CLI_SCHEMA_SQL = `
CREATE TABLE collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE collection_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL,
  required INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  published_at INTEGER
);

CREATE TABLE entry_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES collection_fields(id) ON DELETE CASCADE,
  value TEXT
);

CREATE TABLE entry_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data_snapshot TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT
);
`

function createTempProject() {
  const root = mkdtempSync(join(tmpdir(), "gearu-cli-"))
  const databasePath = join(root, "content.db")
  const connection = new Database(databasePath)
  connection.pragma("foreign_keys = ON")
  connection.exec(CLI_SCHEMA_SQL)

  writeFileSync(
    join(root, "gearu.config.ts"),
    `import type { GearuConfig } from "@gearu/core"

const config: GearuConfig = {
  database: "file:./content.db",
}

export default config
`,
    "utf-8",
  )

  return {
    root,
    connection,
    cleanup() {
      connection.close()
      rmSync(root, { recursive: true, force: true })
    },
  }
}

async function runCli(args: string[]) {
  const stdout: string[] = []
  const stderr: string[] = []
  const logSpy = vi.spyOn(console, "log").mockImplementation((...messages) => {
    stdout.push(messages.join(" "))
  })
  const errorSpy = vi.spyOn(console, "error").mockImplementation((...messages) => {
    stderr.push(messages.join(" "))
  })

  process.exitCode = undefined

  try {
    await createCliProgram("1.0.0").parseAsync(args, { from: "user" })
  } finally {
    logSpy.mockRestore()
    errorSpy.mockRestore()
  }

  return { stdout, stderr, exitCode: process.exitCode }
}

describe("gearu CLI CRUD commands", () => {
  const originalCwd = process.cwd()

  afterEach(() => {
    process.chdir(originalCwd)
    process.exitCode = undefined
  })

  it("lists collections in JSON mode", async () => {
    const project = createTempProject()

    try {
      process.chdir(project.root)
      seedCollection(project.connection, {
        name: "Blog",
        slug: "blog",
        description: "Posts and updates",
      })

      const result = await runCli(["collections", "list", "--json"])
      const payload = JSON.parse(result.stdout[0] ?? "{}") as {
        success: boolean
        data: Array<{ slug: string }>
      }

      expect(result.exitCode).toBeUndefined()
      expect(payload.success).toBe(true)
      expect(payload.data[0]?.slug).toBe("blog")
    } finally {
      project.cleanup()
    }
  })

  it("creates and updates entries with JSON field payloads", async () => {
    const project = createTempProject()

    try {
      process.chdir(project.root)
      const collectionId = seedCollection(project.connection, { name: "Docs", slug: "docs" })
      const fieldId = seedCollectionField(project.connection, {
        collectionId,
        name: "Body",
        slug: "body",
        type: "richtext",
      })

      const createResult = await runCli([
        "entries",
        "create",
        "--collection-id",
        String(collectionId),
        "--title",
        "CLI Entry",
        "--status",
        "draft",
        "--fields",
        JSON.stringify([{ fieldId, value: "<p>Initial</p>" }]),
        "--json",
      ])

      const created = JSON.parse(createResult.stdout[0] ?? "{}") as {
        success: boolean
        data: { id: number; slug: string; status: string }
      }

      expect(created.success).toBe(true)
      expect(created.data.slug).toBe("cli-entry")
      expect(created.data.status).toBe("draft")

      const updateResult = await runCli([
        "entries",
        "update",
        String(created.data.id),
        "--status",
        "published",
        "--fields",
        JSON.stringify([{ fieldId, value: "<p>Published</p>" }]),
        "--json",
      ])

      const updated = JSON.parse(updateResult.stdout[0] ?? "{}") as {
        success: boolean
        data: { id: number; status: string }
      }
      const entryRow = project.connection
        .prepare("SELECT status, published_at FROM entries WHERE id = ?")
        .get(created.data.id) as { status: string; published_at: number | null }
      const fieldRow = project.connection
        .prepare("SELECT value FROM entry_fields WHERE entry_id = ?")
        .get(created.data.id) as { value: string }

      expect(updated.success).toBe(true)
      expect(updated.data.status).toBe("published")
      expect(entryRow.status).toBe("published")
      expect(entryRow.published_at).not.toBeNull()
      expect(fieldRow.value).toBe("<p>Published</p>")
    } finally {
      project.cleanup()
    }
  })

  it("prints friendly JSON errors", async () => {
    const project = createTempProject()

    try {
      process.chdir(project.root)
      seedCollection(project.connection, { name: "Blog", slug: "blog" })

      const result = await runCli([
        "collections",
        "create",
        "--name",
        "Blog",
        "--slug",
        "blog",
        "--json",
      ])

      const payload = JSON.parse(result.stderr[0] ?? "{}") as {
        success: boolean
        error: { message: string }
      }

      expect(result.exitCode).toBe(1)
      expect(payload.success).toBe(false)
      expect(payload.error.message).toBe("A collection with this name already exists.")
    } finally {
      project.cleanup()
    }
  })
})
