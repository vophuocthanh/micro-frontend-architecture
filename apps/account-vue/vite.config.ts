import { federation } from '@module-federation/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

import { name, version } from './package.json';

/**
 * The Account remote shares *nothing* with the shell.
 *
 * Vue is bundled into this remote rather than shared, and that is the correct
 * trade-off here: the shell is a React application, so there is no Vue instance
 * to share with. Sharing only pays off when two applications would otherwise
 * load two copies of the same library — see docs/decisions/ADR-006.
 */
export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'account',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mount.ts',
      },
      dts: false,
      shared: {},
    }),
  ],
  define: {
    __ACCOUNT_VERSION__: JSON.stringify(version),
    __ACCOUNT_NAME__: JSON.stringify(name),
  },
  build: {
    target: 'esnext',
    cssCodeSplit: false,
  },
  server: {
    port: 3002,
    strictPort: true,
    cors: true,
  },
  preview: {
    port: 3002,
    strictPort: true,
    cors: true,
  },
});
