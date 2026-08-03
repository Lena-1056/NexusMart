import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api': { // Catches /api/notifications, /api/orders, etc.
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
