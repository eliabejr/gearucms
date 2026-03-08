import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const isCloudflare = process.env.CF_PAGES === '1' || process.env.DEPLOY_TARGET === 'cloudflare'

const config = defineConfig({
  plugins: [
    devtools(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['url', 'baseLocale'],
    }),
    nitro({
      // For Cloudflare deployment, set DEPLOY_TARGET=cloudflare
      ...(isCloudflare
        ? {
            preset: 'cloudflare-module',
            alias: { '#/db/index': '#/db/index.d1' },
            rollupConfig: {
              external: [/^@sentry\//, 'better-sqlite3'],
            },
          }
        : {
            rollupConfig: { external: [/^@sentry\//] },
          }),
    }),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
