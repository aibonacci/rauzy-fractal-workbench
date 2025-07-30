import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'math-vendor': ['mathjs'],
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['mathjs']
  },
  server: {
    port: 3000,
    open: true
  }
})
