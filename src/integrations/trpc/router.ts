import { createTRPCRouter } from "./init"
import { collectionsRouter } from "./routers/collections"
import { entriesRouter } from "./routers/entries"
import { mediaRouter } from "./routers/media"
import { analyticsRouter } from "./routers/analytics"
import { commentsRouter } from "./routers/comments"
import { settingsRouter } from "./routers/settings"
import { aiRouter } from "./routers/ai"
import { leadsRouter } from "./routers/leads"
import { gearuRouter } from "./routers/gearu"

export const trpcRouter = createTRPCRouter({
	collections: collectionsRouter,
	entries: entriesRouter,
	media: mediaRouter,
	analytics: analyticsRouter,
	comments: commentsRouter,
	settings: settingsRouter,
	ai: aiRouter,
	leads: leadsRouter,
	gearu: gearuRouter,
})

export type TRPCRouter = typeof trpcRouter
