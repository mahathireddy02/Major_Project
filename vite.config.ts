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
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/realtime': {
        target: 'ws://127.0.0.1:5000',
        ws: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/tests/sandboxAuth.test.ts', 'server/tests/notificationLifecycle.test.ts', 'server/tests/pricingEngine.test.ts'],
    exclude: ['server/tests/e2e.test.ts', 'node_modules/**'],
  },
})
