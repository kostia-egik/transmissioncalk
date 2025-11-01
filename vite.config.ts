
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['jspdf'],
  },
  build: {
    // Предотвращаем встраивание мелких файлов в виде data: URL.
    // Это гарантирует, что Service Worker всегда будет отдельным файлом.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'service-worker.js') {
            return 'service-worker.js';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})