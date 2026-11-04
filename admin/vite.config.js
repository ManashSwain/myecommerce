import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const appOrigins = ['http://localhost:5174', 'http://127.0.0.1:5174']
const previewOrigins = ['http://localhost:4173', 'http://127.0.0.1:4173']

// CORS only controls who may read this dev/preview server's responses. The
// admin panel accepts its own dev origins and the backend, but never the
// storefront. Where this app may send requests is governed by
// VITE_API_BASE_URL (and, in production, a CSP set by the host).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBaseUrl = env.VITE_API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Add it to .env (see .env.example).'
    )
  }

  const backendOrigin = new URL(apiBaseUrl).origin

  const corsOptions = {
    origin: [...appOrigins, backendOrigin],
    methods: ['GET', 'HEAD', 'OPTIONS'],
  }

  const previewCorsOptions = {
    origin: [...previewOrigins, backendOrigin],
    methods: ['GET', 'HEAD', 'OPTIONS'],
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      strictPort: true,
      hmr: true,
      cors: corsOptions,
      watch: {
        usePolling: true,
      },
    },
    preview: {
      cors: previewCorsOptions,
    },
  }
})
