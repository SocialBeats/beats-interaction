import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/setup.js'],
    isolate: true,
    threads: false,
    maxConcurrency: 1,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      all: true,
      reportsDirectory: path.resolve('./coverage'),
      exclude: [
        'main.js',
        'tests/**',
        'node_modules/**',
        'vitest.config.js',
        'scripts/**',
        'src/db.js',
        'src/cache.js',
        'commitlint.config.cjs',
        'src/utils/**',
        'src/routes/aboutRoutes.js',
        'src/routes/healthRoutes.js',
      ],
    },
  },
});
