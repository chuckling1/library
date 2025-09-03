import { defineConfig } from 'vitest/config';

// https://vitest.dev/config/
export default defineConfig({
  test: {
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
    globals: true,
  },
});