
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/transmissioncalk/',
  plugins: [react()],
  optimizeDeps: {
    include: ['jspdf'],
  },
})
