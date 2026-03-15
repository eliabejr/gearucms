import { parseEntryFields, parseNullableOption, type EntryFieldInput } from "../lib/parsers"
import { createGearuCliRuntime } from "../lib/runtime"
import { printError, printSuccess, type JsonFlagOption } from "../lib/output"

interface EntryListOptions extends JsonFlagOption {
  collectionId?: number
  status?: "draft" | "published" | "archived"
  limit?: number
  offset?: number
}

interface EntryCreateOptions extends JsonFlagOption {
  collectionId?: number
  title?: string
  slug?: string
  status?: "draft" | "published"
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  fields?: string
}

interface EntryUpdateOptions extends JsonFlagOption {
  title?: string
  slug?: string
  status?: "draft" | "published" | "archived"
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  fields?: string
}

function buildEntryFields(rawFields: string | undefined): EntryFieldInput[] | undefined {
  return parseEntryFields(rawFields)
}

export async function listEntries(options: EntryListOptions) {
  const runtime = await createGearuCliRuntime()

  try {
    const entries = await runtime.caller.entries.list({
      collectionId: options.collectionId,
      status: options.status,
      limit: options.limit,
      offset: options.offset,
    })

    printSuccess(entries, options, (result) => {
      if (result.length === 0) {
        return "No entries found."
      }

      return [
        `Found ${result.length} entr${result.length === 1 ? "y" : "ies"}.`,
        ...result.map(
          (entry) =>
            `#${entry.id} ${entry.title} (${entry.slug}) - ${entry.status}${entry.collection ? ` in ${entry.collection.name}` : ""}`,
        ),
      ].join("\n")
    })
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}

export async function getEntry(id: number, options: JsonFlagOption) {
  const runtime = await createGearuCliRuntime()

  try {
    const entry = await runtime.caller.entries.getById({ id })
    if (!entry) {
      throw new Error(`Entry #${id} was not found.`)
    }

    printSuccess(entry, options, (result) => {
      const lines = [
        `Entry #${result.id}: ${result.title} (${result.slug})`,
        `Status: ${result.status}`,
      ]

      if (result.collection) {
        lines.push(`Collection: ${result.collection.name} (${result.collection.slug})`)
      }
      if (result.metaTitle) {
        lines.push(`Meta title: ${result.metaTitle}`)
      }
      if (result.metaDescription) {
        lines.push(`Meta description: ${result.metaDescription}`)
      }
      if (result.ogImage) {
        lines.push(`OG image: ${result.ogImage}`)
      }

      lines.push(`Fields: ${result.fields.length}`)
      for (const field of result.fields) {
        lines.push(`- ${field.field.name} (#${field.fieldId}): ${field.value ?? "null"}`)
      }

      return lines.join("\n")
    })
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}

export async function createEntry(options: EntryCreateOptions) {
  const runtime = await createGearuCliRuntime()

  try {
    if (!options.collectionId) {
      throw new Error("`--collection-id` is required.")
    }
    if (!options.title) {
      throw new Error("`--title` is required.")
    }

    const entry = await runtime.caller.entries.create({
      collectionId: options.collectionId,
      title: options.title,
      slug: options.slug,
      status: options.status ?? "draft",
      metaTitle: options.metaTitle,
      metaDescription: options.metaDescription,
      ogImage: options.ogImage,
      fields: buildEntryFields(options.fields) ?? [],
    })

    printSuccess(entry, options, (result) => `Created entry #${result.id} ${result.title} (${result.slug}) with status ${result.status}.`)
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}

export async function updateEntry(id: number, options: EntryUpdateOptions) {
  const runtime = await createGearuCliRuntime()

  try {
    const hasContentUpdate =
      options.title !== undefined ||
      options.slug !== undefined ||
      options.metaTitle !== undefined ||
      options.metaDescription !== undefined ||
      options.ogImage !== undefined ||
      options.fields !== undefined

    if (!hasContentUpdate && options.status === undefined) {
      throw new Error(
        "Provide at least one of `--title`, `--slug`, `--status`, `--meta-title`, `--meta-description`, `--og-image`, or `--fields`.",
      )
    }

    let entry = hasContentUpdate
      ? await runtime.caller.entries.update({
          id,
          title: options.title,
          slug: options.slug,
          metaTitle: parseNullableOption(options.metaTitle),
          metaDescription: parseNullableOption(options.metaDescription),
          ogImage: parseNullableOption(options.ogImage),
          fields: buildEntryFields(options.fields),
        })
      : await runtime.caller.entries.getById({ id })

    if (!entry) {
      throw new Error(`Entry #${id} was not found.`)
    }

    if (options.status !== undefined) {
      entry = await runtime.caller.entries.updateStatus({
        id,
        status: options.status,
      })
      if (!entry) {
        throw new Error(`Entry #${id} was not found.`)
      }
    }

    printSuccess(entry, options, (result) => `Updated entry #${result.id} ${result.title} (${result.slug}) with status ${result.status}.`)
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}

export async function deleteEntry(id: number, options: JsonFlagOption) {
  const runtime = await createGearuCliRuntime()

  try {
    await runtime.caller.entries.delete({ id })
    printSuccess({ id }, options, (result) => `Deleted entry #${result.id}.`)
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}
