import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The admin ships inside the public site's deploy, served from /admin, so production assets must
// be requested from that prefix. Development keeps the root, so `npm run dev` stays at
// http://localhost:5174 with no path juggling. `main.jsx` reads the same value through BASE_URL
// to set the router basename, so the two can never drift apart.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/admin/' : '/',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': { target: 'http://localhost:5080', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5080', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
}))
