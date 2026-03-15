import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

function trpcDevServer(): Plugin {
  return {
    name: "gearu-trpc-dev-server",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/trpc")) return next()

        try {
          const { handleTRPC } = await server.ssrLoadModule("/src/server.ts")
          const protocol = "http"
          const host = req.headers.host ?? "localhost:5173"
          const url = `${protocol}://${host}${req.url}`

          // Read body for POST
          let body: string | undefined
          if (req.method === "POST") {
            body = await new Promise<string>((resolve) => {
              let data = ""
              req.on("data", (chunk: Buffer) => { data += chunk.toString() })
              req.on("end", () => resolve(data))
            })
          }

          const fetchReq = new Request(url, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: body ?? undefined,
          })

          const fetchRes: Response = await handleTRPC(fetchReq)
          res.statusCode = fetchRes.status
          fetchRes.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          const text = await fetchRes.text()
          res.end(text)
        } catch (err) {
          console.error("[trpc-dev-server]", err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: "Internal Server Error" }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), trpcDevServer()],
  optimizeDeps: {
    exclude: ["@gearu/core", "@gearu/admin", "@gearu/plugin-analytics", "@gearu/plugin-leads", "better-sqlite3"],
  },
  ssr: {
    noExternal: ["@gearu/core", "@gearu/plugin-analytics", "@gearu/plugin-leads"],
  },
})
