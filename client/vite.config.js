import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const appOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
const previewOrigins = ['http://localhost:4173', 'http://127.0.0.1:4173']

// CORS only controls who may read this dev/preview server's responses. The
// storefront accepts its own dev origins and the backend, but never the admin
// panel. Where this app may send requests is governed by VITE_API_BASE_URL
// (and, in production, a CSP set by the host).
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
      // Keep the dev origin stable: the API's CORS allow-list is configured for
      // http://localhost:5173. Update CLIENT_URL/CORS_ORIGINS when changing it.
      port: 5173,
      strictPort: true,
      cors: corsOptions,
    },
    preview: {
      cors: previewCorsOptions,
    },
  }
})
