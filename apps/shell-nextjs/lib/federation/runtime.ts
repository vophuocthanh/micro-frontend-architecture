'use client';

import type { MfeModule, RemoteDefinition, RuntimeConfig } from '@banking/contracts';
import { init, loadRemote } from '@module-federation/enhanced/runtime';

/** A remote that has not answered in this long is treated as unavailable. */
const REMOTE_LOAD_TIMEOUT_MS = 10_000;

let initialised = false;

/**
 * Wires the shell up as a Module Federation host.
 *
 * **Nothing is shared, deliberately — including React.**
 *
 * The obvious move is to hand the host's React to the React remote as a
 * singleton, and it is a trap here: Next.js pins a *canary* build of React
 * (`19.2.0-canary-…`) that no independently released remote can be expected to
 * depend on. Providing it produced the classic half-shared state — the remote
 * got the host's `react` but kept its own `react-dom` — and React refused to
 * render with "Incompatible React versions" (error #527).
 *
 * Making the remote match would mean pinning it to whichever canary Next.js
 * happens to bundle, so every Next.js upgrade would force a coordinated release
 * of the Dashboard. That is precisely the coupling this architecture exists to
 * remove, and it costs more than the ~45 kB gzip of a second React.
 *
 * Because each remote mounts into its own framework root through the mount
 * contract, two Reacts in the page never meet: the host never renders a remote's
 * component, so no hook ever crosses an instance boundary. Sharing would be an
 * optimisation, not a correctness requirement — see docs/decisions/ADR-006.
 */
export function initialiseFederation(config: RuntimeConfig): void {
  if (initialised) return;
  initialised = true;

  init({
    name: 'shell',
    remotes: config.remotes.map((remote) => ({
      name: remote.name,
      entry: remote.entry,
      // Every remote is built by Vite, so its container is an ES module. The
      // runtime otherwise injects a classic <script>, and the browser rejects
      // the very first `import` with "Cannot use import statement outside a
      // module" — a failure that looks like a network problem but is not.
      type: 'module' as const,
    })),
  });
}

export class RemoteLoadError extends Error {
  constructor(
    readonly remoteId: string,
    readonly reason: 'timeout' | 'unavailable' | 'invalid-contract',
    message: string,
  ) {
    super(message);
    this.name = 'RemoteLoadError';
  }
}

/**
 * Loads one remote's mount module, bounded by a timeout.
 *
 * A remote whose origin is unreachable will otherwise leave `loadRemote`
 * pending indefinitely — and a spinner that never resolves is a worse failure
 * than an error with a retry button.
 */
export async function loadRemoteModule(
  config: RuntimeConfig,
  remote: RemoteDefinition,
): Promise<MfeModule> {
  initialiseFederation(config);

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () =>
        reject(
          new RemoteLoadError(
            remote.id,
            'timeout',
            `"${remote.id}" did not respond within ${REMOTE_LOAD_TIMEOUT_MS / 1000} seconds`,
          ),
        ),
      REMOTE_LOAD_TIMEOUT_MS,
    );
  });

  const load = loadRemote<MfeModule>(`${remote.name}/${remote.module.replace('./', '')}`).catch(
    (error: unknown) => {
      throw new RemoteLoadError(
        remote.id,
        'unavailable',
        error instanceof Error ? error.message : `"${remote.id}" could not be loaded`,
      );
    },
  );

  const remoteModule = await Promise.race([load, timeout]);

  // A remote that loads but does not honour the contract is a deployment
  // mistake worth naming precisely — it is not the same failure as an outage.
  if (!remoteModule || typeof remoteModule.mount !== 'function') {
    throw new RemoteLoadError(
      remote.id,
      'invalid-contract',
      `"${remote.id}" loaded but does not export a mount() function`,
    );
  }

  return remoteModule;
}
