import { relations } from "drizzle-orm"
import { leadForms, leads } from "./schema"

export const leadFormsRelations = relations(leadForms, ({ many }) => ({
	leads: many(leads),
}))

export const leadsRelations = relations(leads, ({ one }) => ({
	form: one(leadForms, {
		fields: [leads.formId],
		references: [leadForms.id],
	}),
}))
