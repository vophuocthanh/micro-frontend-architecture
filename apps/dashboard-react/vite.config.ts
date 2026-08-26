import { fileURLToPath } from 'node:url';

import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
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
    tailwindcss(),
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
      // Generous, because the default 10s is measured against *machine load*,
      // not project size: five packages building in parallel is enough to stall
      // this one past the limit, and the plugin then emits an empty chunk from a
      // build that still reports success.
      moduleParseIdleTimeout: 60,
      // React is bundled, not shared — even though the host is also a React
      // application. Next.js pins a canary React that this remote cannot
      // reasonably depend on, and a partially-satisfied singleton is worse than
      // none: it yields "Incompatible React versions" at mount time. See
      // docs/decisions/ADR-006 for the measurement behind this trade-off.
      shared: {},
    }),
  ],
  resolve: {
    // shadcn generates components with `@/` imports; this is what makes them
    // resolve without rewriting every file the CLI produces.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    // Surfaced by the mount contract so the shell can report which build of
    // this remote is actually live — the whole point of independent versioning.
    __DASHBOARD_VERSION__: JSON.stringify(version),
    __DASHBOARD_NAME__: JSON.stringify(name),
  },
  build: {
    // Module Federation relies on top-level await in the generated container.
    target: 'esnext',
    /**
     * Per-entry CSS, deliberately.
     *
     * Merging every stylesheet into one file also merges `standalone.css` —
     * which carries Tailwind's preflight — into the bundle the shell loads, and
     * the remote would then reset the whole document. Splitting keeps the
     * federated entry's CSS to exactly what `bootstrap.tsx` imports, and the
     * federation plugin injects that file and no other.
     */
    cssCodeSplit: true,
  },
  server: {
    port: 3001,
    strictPort: true,
    // The shell is served from a different origin, so it cannot fetch
    // `remoteEntry.js` without this.
    cors: true,
    /**
     * React Fast Refresh is switched off when this remote is being consumed by
     * the shell, and only then.
     *
     * The plugin injects a "preamble" into its own `index.html` that defines
     * `window.$RefreshReg$`. Standalone that works; federated, the page belongs
     * to Next.js — which installs a *different* refresh runtime — and the
     * remote throws `can't detect preamble` before it can render.
     *
     * The fix that keeps the architecture honest is for the remote to stop
     * expecting it, rather than for the shell to learn that one of its remotes
     * is a Vite React app. `server.hmr: false` is what the plugin reads to skip
     * the transform (see `skipFastRefresh` in @vitejs/plugin-react).
     *
     * Cost: inside the composed shell an edit needs a manual refresh. Running
     * `pnpm dev:dashboard` — the documented fast loop for this domain — keeps
     * full HMR.
     */
    hmr: !process.env.MFE_FEDERATED,
  },
  preview: {
    port: 3001,
    strictPort: true,
    cors: true,
  },
});
