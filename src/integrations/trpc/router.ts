import { createTRPCRouter } from "./init"
import { collectionsRouter } from "./routers/collections"
import { entriesRouter } from "./routers/entries"
import { mediaRouter } from "./routers/media"
import { analyticsRouter } from "./routers/analytics"
import { commentsRouter } from "./routers/comments"
import { settingsRouter } from "./routers/settings"
import { aiRouter } from "./routers/ai"

export const trpcRouter = createTRPCRouter({
	collections: collectionsRouter,
	entries: entriesRouter,
	media: mediaRouter,
	analytics: analyticsRouter,
	comments: commentsRouter,
	settings: settingsRouter,
	ai: aiRouter,
})

export type TRPCRouter = typeof trpcRouter
