import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Local dev: forward /api to the Flask server (python backend/app.py).
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
