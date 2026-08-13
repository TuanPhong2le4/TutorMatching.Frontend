import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://tutormatchingplatform.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'https://tutormatchingplatform.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
