export interface EntryFieldInput {
  fieldId: number
  value: string | null
}

export function parseInteger(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} must be an integer.`)
  }
  return parsed
}

export function createIntegerParser(label: string) {
  return (value: string) => parseInteger(value, label)
}

export function parseNullableOption(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined
  return value === "null" ? null : value
}

export function parseEntryFields(value: string | undefined): EntryFieldInput[] | undefined {
  if (value === undefined) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error("`--fields` must be valid JSON.")
  }

  if (!Array.isArray(parsed)) {
    throw new Error("`--fields` must be a JSON array.")
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Field at index ${index} must be an object.`)
    }

    const candidate = item as Record<string, unknown>
    if (!Number.isInteger(candidate.fieldId)) {
      throw new Error(`Field at index ${index} must include an integer fieldId.`)
    }

    if (!(typeof candidate.value === "string" || candidate.value === null)) {
      throw new Error(`Field at index ${index} must include a string or null value.`)
    }

    return {
      fieldId: candidate.fieldId,
      value: candidate.value,
    }
  })
}
