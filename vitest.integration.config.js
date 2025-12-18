export default {
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/setup-tests.js'],
    hookTimeout: 30000,
    isolate: true,
    threads: false,
    maxConcurrency: 1,
    testTimeout: 30000,
  },
};
