import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, 'index.html'),
        admin: path.resolve(rootDir, 'admin.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
