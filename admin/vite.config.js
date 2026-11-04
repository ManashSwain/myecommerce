import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { API_BASE_URL } from './src/constants.js'

const backendOrigin = new URL(API_BASE_URL).origin

const appOrigins = ['http://localhost:5174', 'http://127.0.0.1:5174']
const previewOrigins = ['http://localhost:4173', 'http://127.0.0.1:4173']

// CORS only controls who may read this dev/preview server's responses. The
// admin panel accepts its own dev origins and the backend, but never the
// storefront. Where this app may send requests is governed by API_BASE_URL
// (and, in production, a CSP set by the host).
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
    port: 5174,
    strictPort: true,
    hmr: true,
    cors: corsOptions,
    watch: {
    usePolling: true
  }
  },
  preview: {
    cors: previewCorsOptions,
  },
})

