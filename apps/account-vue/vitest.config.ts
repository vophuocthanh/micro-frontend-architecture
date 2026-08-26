import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/**
 * Separate from `vite.config.ts`: the federation plugin rewrites imports into
 * virtual share modules, which is exactly what a unit test must not have to
 * reason about.
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  define: {
    __ACCOUNT_VERSION__: JSON.stringify('test'),
    __ACCOUNT_NAME__: JSON.stringify('@banking/account-vue'),
  },
});
