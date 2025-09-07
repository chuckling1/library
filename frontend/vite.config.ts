import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Type declaration for Node.js process
declare const process: { env: Record<string, string | undefined> }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'api-vendor': ['axios'],
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Force modern Sass API - prevent legacy JS API usage
        api: 'modern-compiler',
        silenceDeprecations: [],
        additionalData: ``,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/generated/',
        '**/*.d.ts',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
  },
})