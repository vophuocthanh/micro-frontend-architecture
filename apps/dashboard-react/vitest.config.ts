import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * A separate config from `vite.config.ts` on purpose: the federation plugin
 * rewrites imports into virtual share modules, which is exactly what a unit
 * test must not have to reason about.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  define: {
    __DASHBOARD_VERSION__: JSON.stringify('test'),
    __DASHBOARD_NAME__: JSON.stringify('@banking/dashboard-react'),
  },
});
