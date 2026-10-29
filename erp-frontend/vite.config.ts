import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-ruc': {
        target: 'https://api-tipo-cambio-1.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-ruc/, '/api')
      }
    }
  }
})
