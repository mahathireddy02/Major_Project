import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/tests/notificationLifecycle.test.ts', 'server/tests/pricingEngine.test.ts'],
    exclude: ['server/tests/e2e.test.ts', 'node_modules/**'],
  },
})
