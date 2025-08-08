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
    open: true,
    // 确保静态文件正确提供
    fs: {
      strict: false
    }
  },
  // 确保配置文件在构建时被包含
  publicDir: 'public'
})
