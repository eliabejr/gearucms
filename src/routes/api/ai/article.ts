import { createFileRoute } from "@tanstack/react-router"
import { chat, toServerSentEventsResponse } from "@tanstack/ai"
import { anthropicText } from "@tanstack/ai-anthropic"
import { auth } from "#/lib/auth"

export const Route = createFileRoute("/api/ai/article")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				})
				if (!session?.user) {
					return new Response("Unauthorized", { status: 401 })
				}

				const { title } = (await request.json()) as { title: string }

				const systemPrompt = `You are a professional blog article writer. Write a comprehensive, well-structured blog article based on the given title. Use markdown formatting with:
- An engaging introduction
- Multiple sections with ## headings
- Practical examples and insights
- A conclusion section
- Write in a professional yet approachable tone
- Article should be 800-1500 words
- Do NOT include the title as an H1 heading at the start (it will be added separately)`

				const stream = chat({
					adapter: anthropicText("claude-sonnet-4-20250514"),
					system: systemPrompt,
					messages: [
						{
							role: "user",
							content: `Write a blog article with the title: "${title}"`,
						},
					],
				})

				return toServerSentEventsResponse(stream)
			},
		},
	},
})
