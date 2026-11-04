import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { API_BASE_URL } from './src/constants/index.js'

const backendOrigin = new URL(API_BASE_URL).origin

const appOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
const previewOrigins = ['http://localhost:4173', 'http://127.0.0.1:4173']

// CORS only controls who may read this dev/preview server's responses. The
// storefront accepts its own dev origins and the backend, but never the admin
// panel. Where this app may send requests is governed by API_BASE_URL (and,
// in production, a CSP set by the host).
const corsOptions = {
  origin: [...appOrigins, backendOrigin],
  methods: ['GET', 'HEAD', 'OPTIONS'],
}

const previewCorsOptions = {
  origin: [...previewOrigins, backendOrigin],
  methods: ['GET', 'HEAD', 'OPTIONS'],
}

// https://vite.dev/config/
export default defineConfig({

  plugins: [react(),
    tailwindcss(),
  ],
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

})
