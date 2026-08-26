# Module Federation in practice

The [README](../../README.md#5-module-federation-host-remote-runtime-loading)
covers what federation is used for and
[ADR-001](../decisions/ADR-001-host-and-remotes.md) covers why. This document is
the operational half: what actually breaks, and how to tell which failure you
are looking at.

## The four moving parts

| Term | Here |
|---|---|
| **Host** | The shell. Registers remotes and calls `loadRemote()`. Not built by a federation plugin — it uses the runtime API. |
| **Remote** | dashboard, account, transfer. Each built by `@module-federation/vite`. |
| **Remote entry** | `remoteEntry.js` (~5.5 kB gzip) — a manifest plus a loader, not the application. |
| **Share scope** | Deliberately empty. [ADR-006](../decisions/ADR-006-shared-dependencies.md) explains why. |

## Failure modes and what they look like

These are the ones actually hit while building this, with the symptom that
appears in a browser console.

### `Cannot use import statement outside a module`

**Cause.** The runtime injected a classic `<script>` tag for a container that
Vite built as an ES module.

**Fix.** Register the remote with `type: 'module'`:

```ts
remotes: runtimeConfig.remotes.map((remote) => ({
  name: remote.name,
  entry: remote.entry,
  type: 'module' as const,
})),
```

**Why it is confusing.** The network tab shows `remoteEntry.js` fetched with a
200. Nothing failed to load — the browser refused to *execute* it.

### `Incompatible React versions` (React error #527)

**Cause.** A partially-satisfied share scope: the remote resolved the host's
`react` but kept its own `react-dom`. With a Next.js host this is near-certain,
because Next.js pins a canary React (`19.2.0-canary-…`) that no ordinary
`^19.0.0` range matches.

**Fix.** Stop sharing React. Full reasoning and the measured cost:
[ADR-006](../decisions/ADR-006-shared-dependencies.md).

**Why it is confusing.** It presents as a federation bug and is a semver bug.

### An exposed module builds to an empty chunk

**Symptom.** The build succeeds. `dist/assets/mount-*.js` is `0.00 kB`, and the
remote mounts nothing.

**Cause seen here.** The Angular remote's tsconfig inherited `noEmit: true` from
the shared browser config. The Angular compiler *is* the emitter, so it silently
produced nothing — while Vite still reported "✓ 293 modules transformed".

**How to diagnose.** Build the remote **without** the federation plugin. If the
output is also tiny, the problem is the framework compiler, not federation. That
one experiment separates the two halves of the toolchain in about a minute.

### `"mount" is not exported by "src/mount.ts"` — intermittently

**Symptom.** The remote builds fine most of the time. Occasionally the same
command fails with the standalone entry unable to see the exposed module's
exports, alongside a `moduleParseIdleTimeout` warning about a module that never
finished parsing.

**Cause.** Two entry points reached the same module. `mount.ts` is the module
federation virtualises, and `main.ts` — the standalone entry — imported `mount`
from it directly. The bundler then has two routes into a module the plugin is
rewriting, and which wins is a race. It surfaced first on the Angular remote
simply because that compilation is the slowest.

**Fix.** Give the two entry points a common dependency instead of chaining them:

```
bootstrap.ts   ← all the real logic
   ├── mount.ts   (federation entry: `export const mount = bootstrapX`)
   └── main.ts    (standalone entry: calls bootstrapX directly)
```

All three remotes are structured this way. It also reads better: the federation
entry becomes a thin, obviously-stable boundary, and nothing behind it is
reachable from outside.

**Why it is confusing.** It is intermittent, and the error names a file whose
export is plainly right there in the source.

### A remote loads but the shell reports `invalid-contract`

The container was fetched and executed, but the exposed module has no `mount`
function. This is a **bad deploy, not an outage** — usually a remote built from a
branch where the contract changed. The shell distinguishes it from
`unavailable` on purpose, because the two need completely different responses.

## Why the container is fetched at runtime, not built in

`remoteEntry.js` URLs come from environment variables read **per request by the
server** ([`runtime-config.ts`](../../apps/shell-nextjs/lib/config/runtime-config.ts)):

```
DASHBOARD_REMOTE_ENTRY=https://dashboard.example.com/remoteEntry.js
```

Note the absence of a `NEXT_PUBLIC_` prefix, and treat it as load-bearing.
Next.js **inlines `NEXT_PUBLIC_*` into the client bundle at build time**, so
using one here would silently turn the registry into a build-time constant —
the code would look identical and the deployment property would be gone. These
are read by the root layout (`export const dynamic = 'force-dynamic'`) and
handed to the browser as props.

You can verify it holds:

```bash
pnpm --filter @banking/shell-nextjs build
pnpm --filter @banking/shell-nextjs start                       # → localhost:3001
DASHBOARD_REMOTE_ENTRY=https://canary.example.com/remoteEntry.js \
  pnpm --filter @banking/shell-nextjs start                     # → canary, same build
```

Repointing a route at a different build — a canary, or a rollback — is a
variable change and a restart. If these were compiled in, every remote release
would require a shell rebuild, and the architecture would deliver none of what
it costs.

## Local verification

```bash
# Is the container reachable and correctly typed?
curl -I http://localhost:3001/remoteEntry.js     # expect: content-type: text/javascript

# Will the browser be allowed to fetch it cross-origin?
curl -sD - -o /dev/null -H 'Origin: http://localhost:3000' \
  http://localhost:3001/remoteEntry.js | grep -i access-control-allow-origin

# Does the shell's CSP permit executing it?
curl -sD - -o /dev/null http://localhost:3000/login | grep -i content-security-policy
```

A remote missing from `script-src` fails with a CSP violation, not a network
error — worth checking second, because the network tab looks healthy.
