import angular from '@analogjs/vite-plugin-angular';
import { federation } from '@module-federation/vite';
import { defineConfig } from 'vite';

import { name, version } from './package.json';

/**
 * Angular built through Vite rather than the Angular CLI.
 *
 * The CLI's builder produces an application bundle, not a Module Federation
 * container, and the webpack plugin that used to bridge the two has not kept up
 * with Angular's move to esbuild. Compiling with Analog's Angular plugin puts
 * this remote on the same Vite + federation toolchain as the React and Vue
 * remotes — one build system to reason about instead of three.
 */
export default defineConfig(({ mode }) => ({
  plugins: [
    // The plugin must be pointed at the *application* project: the root
    // tsconfig is a solution file with `files: []`, so the Angular compiler
    // would otherwise be handed an empty program and emit nothing.
    angular({ jit: false, tsconfig: './tsconfig.app.json' }),
    federation({
      name: 'transfer',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mount.ts',
      },
      dts: false,
      /**
       * The plugin gives up waiting for module activity after 10s by default
       * and force-resolves the graph. Compiling Angular is slow enough that a
       * loaded machine — `turbo` building five packages at once, say — crosses
       * that line, and the exposed module then emits as an **empty chunk**.
       *
       * The build still succeeds. The failure only appears in a browser, as the
       * shell reporting `invalid-contract`, which is a long way from the cause.
       * `verify-remote-entry.mjs` closes that gap; this stops it happening.
       */
      moduleParseIdleTimeout: 60,
      // Angular is bundled, never shared: the host is a React application, so
      // there is no second Angular instance to deduplicate against.
      shared: {},
    }),
  ],
  define: {
    __TRANSFER_VERSION__: JSON.stringify(version),
    __TRANSFER_NAME__: JSON.stringify(name),
    // Strips Angular's development-only assertions from the production bundle.
    ngDevMode: mode === 'production' ? 'false' : 'undefined',
  },
  build: {
    target: 'esnext',
    cssCodeSplit: false,
  },
  server: {
    port: 3003,
    strictPort: true,
    cors: true,
  },
  preview: {
    port: 3003,
    strictPort: true,
    cors: true,
  },
}));
