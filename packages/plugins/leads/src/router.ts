import { z } from "zod"
import { eq, desc, sql } from "drizzle-orm"
import { leadForms, leads } from "./schema"

const fieldSchema = z.object({
	name: z.string().min(1),
	label: z.string().min(1),
	type: z.enum(["text", "email", "phone", "textarea", "select", "number", "url"]),
	required: z.boolean().default(false),
	placeholder: z.string().optional(),
	options: z.string().optional(),
})

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_]+/g, "-")
		.replace(/-+/g, "-")
}

/**
 * Context passed by the host app to build the leads router.
 * db should be the result of createDb(connection, { plugins: [leadsPlugin] }).
 */
export interface CreateLeadsRouterContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	db: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	publicProcedure: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protectedProcedure: any
	TRPCError: new (opts: { code: string; message: string }) => Error
}

/**
 * Create the leads tRPC router. Call this from the host app with your db and tRPC procedures.
 */
export function createLeadsRouter(ctx: CreateLeadsRouterContext) {
	const { db, publicProcedure, protectedProcedure, TRPCError } = ctx
	return {
		listForms: protectedProcedure.query(async (): Promise<unknown> => {
			const forms = await db.select().from(leadForms).orderBy(desc(leadForms.createdAt))
			return (forms as { id: number; name: string; slug: string; tag: string; fields: string; createdAt: Date | null }[]).map((f) => ({
				...f,
				fields: JSON.parse(f.fields) as z.infer<typeof fieldSchema>[],
			}))
		}),
		createForm: protectedProcedure
			.input(z.object({ name: z.string().min(1), tag: z.string().min(1), fields: z.array(fieldSchema).default([]) }))
			.mutation(async (opts: { input: { name: string; tag: string; fields: unknown[] } }) => {
				const { input } = opts
				const slug = slugify(input.name)
				const [form] = await db.insert(leadForms).values({
					name: input.name,
					slug,
					tag: input.tag,
					fields: JSON.stringify(input.fields),
				}).returning()
				return form
			}),
		updateForm: protectedProcedure
			.input(z.object({
				id: z.number(),
				name: z.string().min(1).optional(),
				tag: z.string().min(1).optional(),
				fields: z.array(fieldSchema).optional(),
			}))
			.mutation(async (opts: { input: { id: number; name?: string; tag?: string; fields?: unknown[] } }) => {
				const { input } = opts
				const updates: Record<string, unknown> = { updatedAt: sql`(unixepoch())` }
				if (input.name !== undefined) {
					updates.name = input.name
					;(updates as any).slug = slugify(input.name)
				}
				if (input.tag !== undefined) updates.tag = input.tag
				if (input.fields !== undefined) updates.fields = JSON.stringify(input.fields)
				const [form] = await db.update(leadForms).set(updates).where(eq(leadForms.id, input.id)).returning()
				return form
			}),
		deleteForm: protectedProcedure
			.input(z.object({ id: z.number() }))
			.mutation(async (opts: { input: { id: number } }) => {
				const { input } = opts
				await db.delete(leadForms).where(eq(leadForms.id, input.id))
				return { success: true }
			}),
		listLeads: protectedProcedure
			.input(z.object({
				formId: z.number().optional(),
				tag: z.string().optional(),
				limit: z.number().default(50),
				offset: z.number().default(0),
			}).optional())
			.query(async (opts: { input?: { formId?: number; tag?: string; limit?: number; offset?: number } }) => {
				const filters = opts.input ?? {}
				let query = db
					.select()
					.from(leads)
					.leftJoin(leadForms, eq(leads.formId, leadForms.id))
					.orderBy(desc(leads.createdAt))
					.limit(filters.limit ?? 50)
					.offset(filters.offset ?? 0)
				if (filters.formId) query = query.where(eq(leads.formId, filters.formId)) as typeof query
				else if (filters.tag) query = query.where(eq(leads.formTag, filters.tag)) as typeof query
				const results = await query
				return results.map((r: { leads: unknown; lead_forms: unknown }) => ({ ...(r.leads as object), form: r.lead_forms }))
			}),
		deleteLead: protectedProcedure
			.input(z.object({ id: z.number() }))
			.mutation(async (opts: { input: { id: number } }) => {
				const { input } = opts
				await db.delete(leads).where(eq(leads.id, input.id))
				return { success: true }
			}),
		getFormBySlug: publicProcedure
			.input(z.object({ slug: z.string() }))
			.query(async (opts: { input: { slug: string } }) => {
				const { input } = opts
				const rows = await db.select().from(leadForms).where(eq(leadForms.slug, input.slug))
				const form = rows[0]
				if (!form) return null
				return {
					id: form.id,
					name: form.name,
					slug: form.slug,
					tag: form.tag,
					fields: JSON.parse(form.fields) as z.infer<typeof fieldSchema>[],
				}
			}),
		submitLead: publicProcedure
			.input(z.object({
				formId: z.number(),
				name: z.string(),
				email: z.string(),
				data: z.record(z.string(), z.string()).default({}),
				utmSource: z.string().optional(),
				utmMedium: z.string().optional(),
				utmCampaign: z.string().optional(),
				utmTerm: z.string().optional(),
				utmContent: z.string().optional(),
				referrer: z.string().optional(),
			}))
			.mutation(async (opts: { input: { formId: number; name: string; email: string; data: Record<string, string>; utmSource?: string; utmMedium?: string; utmCampaign?: string; utmTerm?: string; utmContent?: string; referrer?: string } }) => {
				const { input } = opts
				const formRows = await db.select().from(leadForms).where(eq(leadForms.id, input.formId))
				const form = formRows[0]
				if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" })
				if (!input.name.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Name is required" })
				if (!input.email.trim()) throw new TRPCError({ code: "BAD_REQUEST", message: "Email is required" })
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
				if (!emailRegex.test(input.email)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid email format" })
				const formFields = JSON.parse(form.fields) as z.infer<typeof fieldSchema>[]
				for (const field of formFields) {
					if (field.required) {
						const value = input.data[field.name]
						if (!value || !String(value).trim()) throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} is required` })
					}
				}
				const [lead] = await db.insert(leads).values({
					formId: input.formId,
					name: input.name.trim(),
					email: input.email.trim().toLowerCase(),
					data: JSON.stringify(input.data),
					formTag: form.tag,
					utmSource: input.utmSource ?? null,
					utmMedium: input.utmMedium ?? null,
					utmCampaign: input.utmCampaign ?? null,
					utmTerm: input.utmTerm ?? null,
					utmContent: input.utmContent ?? null,
					referrer: input.referrer ?? null,
				}).returning()
				return { success: true, id: lead.id }
			}),
	}
}
