import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { name, version } from './package.json';

/**
 * This application is a *remote*: it produces a `remoteEntry.js` that the shell
 * loads at runtime, and it also runs standalone on port 3001.
 *
 * Both must keep working. Standalone is what makes the team owning this domain
 * able to develop without booting the rest of the platform, and it is the
 * fallback that proves a bug is ours rather than the shell's.
 */
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'dashboard',
      filename: 'remoteEntry.js',
      // A single, deliberately small surface. The shell knows this module and
      // nothing else about the Dashboard domain, so anything not listed here
      // can be refactored freely without coordinating a release.
      exposes: {
        './mount': './src/mount.tsx',
      },
      // Remote type generation is switched off deliberately: the shell does not
      // consume generated `.d.ts` files from remotes, it compiles against the
      // shared `@banking/contracts` mount contract. That is the stricter
      // guarantee — the shell's types come from the agreed contract, not from
      // whatever a remote happens to export today.
      dts: false,
      // React is bundled, not shared — even though the host is also a React
      // application. Next.js pins a canary React that this remote cannot
      // reasonably depend on, and a partially-satisfied singleton is worse than
      // none: it yields "Incompatible React versions" at mount time. See
      // docs/decisions/ADR-006 for the measurement behind this trade-off.
      shared: {},
    }),
  ],
  define: {
    // Surfaced by the mount contract so the shell can report which build of
    // this remote is actually live — the whole point of independent versioning.
    __DASHBOARD_VERSION__: JSON.stringify(version),
    __DASHBOARD_NAME__: JSON.stringify(name),
  },
  build: {
    // Module Federation relies on top-level await in the generated container.
    target: 'esnext',
    // One stylesheet rather than per-chunk CSS: the shell injects whatever the
    // remote ships, and a single predictable file is far easier to reason about.
    cssCodeSplit: false,
  },
  server: {
    port: 3001,
    strictPort: true,
    // The shell is served from a different origin, so it cannot fetch
    // `remoteEntry.js` without this.
    cors: true,
  },
  preview: {
    port: 3001,
    strictPort: true,
    cors: true,
  },
});
