import { createFileRoute } from "@tanstack/react-router"
import { auth } from "#/lib/auth"
import { db } from "#/db/index"
import { media } from "#/db/schema"

export const Route = createFileRoute("/api/upload")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				})
				if (!session?.user) {
					return new Response("Unauthorized", { status: 401 })
				}

				try {
					const formData = await request.formData()
					const file = formData.get("file") as File | null

					if (!file) {
						return Response.json(
							{ error: "No file provided" },
							{ status: 400 },
						)
					}

					const ext = file.name.split(".").pop() || "bin"
					const uuid = crypto.randomUUID()
					const filename = `${uuid}.${ext}`
					const url = `/uploads/${filename}`

					const buffer = Buffer.from(await file.arrayBuffer())

					const fs = await import("node:fs/promises")
					const path = await import("node:path")
					const uploadDir = path.join(process.cwd(), "public", "uploads")
					await fs.mkdir(uploadDir, { recursive: true })
					await fs.writeFile(path.join(uploadDir, filename), buffer)

					const [record] = await db
						.insert(media)
						.values({
							filename,
							originalName: file.name,
							url,
							size: file.size,
							mimeType: file.type,
						})
						.returning()

					return Response.json(record)
				} catch (error) {
					console.error("Upload error:", error)
					return Response.json(
						{ error: "Upload failed" },
						{ status: 500 },
					)
				}
			},
		},
	},
})
