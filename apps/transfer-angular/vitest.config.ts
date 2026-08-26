import { defineConfig } from 'vitest/config';

/**
 * Covers the Transfer domain's pure logic — its policy mirror, its error
 * normalisation and its wizard helpers.
 *
 * Angular's own `TestBed` is not wired up here: this remote's risky logic is
 * deliberately kept out of components (see `transfer-wizard.store.ts`), so the
 * parts most worth testing need no framework at all. Component behaviour is
 * covered end to end in `apps/e2e`, where it runs inside the real shell.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.spec.ts'],
  },
});
