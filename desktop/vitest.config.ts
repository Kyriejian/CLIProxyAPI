import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@proxy': path.resolve(__dirname, './proxy'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['proxy/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['proxy/**/*.ts'],
      exclude: ['proxy/__tests__/**', 'proxy/db/**'],
    },
  },
});
