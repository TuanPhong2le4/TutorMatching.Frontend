import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://tutorplatform-gcduceejgkefcya6.eastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'https://tutorplatform-gcduceejgkefcya6.eastasia-01.azurewebsites.net',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
