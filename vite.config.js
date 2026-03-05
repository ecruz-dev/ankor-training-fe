import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || env.VITE_SUPABASE_URL

  return {
    plugins: [react()],
    server: {
      // Allow access via ngrok or other external hosts.
      allowedHosts: true,
      proxy: backendUrl
        ? {
            '/functions/v1': {
              target: backendUrl,
              changeOrigin: true,
              secure: true,
            },
          }
        : undefined,
    },
  }
})
