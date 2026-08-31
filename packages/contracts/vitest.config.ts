import { defineConfig } from 'vitest/config';

/**
 * The contracts package is mostly types, which need no runtime test — but the
 * event bus is real behaviour that three applications depend on, and its replay
 * rule is the one piece of platform logic whose failure mode is silence.
 *
 * Node rather than jsdom: the bus is built on `EventTarget` and `CustomEvent`,
 * both of which Node has had since v19. Pulling in a DOM implementation to test
 * code that does not touch the DOM would only hide that fact.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
