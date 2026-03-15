import { createGearuCliRuntime } from "../lib/runtime"
import { printError, printSuccess, type JsonFlagOption } from "../lib/output"

interface CollectionMutationOptions extends JsonFlagOption {
  name?: string
  slug?: string
  description?: string
}

export async function listCollections(options: JsonFlagOption) {
  const runtime = await createGearuCliRuntime()

  try {
    const collections = await runtime.caller.collections.list()
    printSuccess(collections, options, (result) => {
      if (result.length === 0) {
        return "No collections found."
      }

      return [
        `Found ${result.length} collection${result.length === 1 ? "" : "s"}.`,
        ...result.map(
          (collection) =>
            `#${collection.id} ${collection.name} (${collection.slug}) - ${collection.fields.length} field${collection.fields.length === 1 ? "" : "s"}, ${collection.entries.length} entr${collection.entries.length === 1 ? "y" : "ies"}`,
        ),
      ].join("\n")
    })
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}

export async function getCollection(id: number, options: JsonFlagOption) {
  const runtime = await createGearuCliRuntime()

  try {
    const collection = await runtime.caller.collections.getById({ id })
    if (!collection) {
      throw new Error(`Collection #${id} was not found.`)
    }

    printSuccess(collection, options, (result) => {
      const lines = [`Collection #${result.id}: ${result.name} (${result.slug})`]
      if (result.description) {
        lines.push(`Description: ${result.description}`)
      }
      lines.push(`Fields: ${result.fields.length}`)
      for (const field of result.fields) {
        lines.push(
          `- #${field.id} ${field.name} (${field.slug}) [${field.type}]${field.required ? " required" : ""}`,
        )
      }
      return lines.join("\n")
    })
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}

export async function createCollection(options: CollectionMutationOptions) {
  const runtime = await createGearuCliRuntime()

  try {
    if (!options.name) {
      throw new Error("`--name` is required.")
    }

    const collection = await runtime.caller.collections.create({
      name: options.name,
      slug: options.slug,
      description: options.description,
    })

    printSuccess(collection, options, (result) => `Created collection #${result.id} ${result.name} (${result.slug}).`)
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}

export async function updateCollection(id: number, options: CollectionMutationOptions) {
  const runtime = await createGearuCliRuntime()

  try {
    if (options.name === undefined && options.slug === undefined && options.description === undefined) {
      throw new Error("Provide at least one of `--name`, `--slug`, or `--description`.")
    }

    const collection = await runtime.caller.collections.update({
      id,
      name: options.name,
      slug: options.slug,
      description: options.description,
    })

    if (!collection) {
      throw new Error(`Collection #${id} was not found.`)
    }

    printSuccess(collection, options, (result) => `Updated collection #${result.id} ${result.name} (${result.slug}).`)
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}

export async function deleteCollection(id: number, options: JsonFlagOption) {
  const runtime = await createGearuCliRuntime()

  try {
    await runtime.caller.collections.delete({ id })
    printSuccess({ id }, options, (result) => `Deleted collection #${result.id}.`)
  } catch (error) {
    printError(error, options)
  } finally {
    runtime.close()
  }
}
