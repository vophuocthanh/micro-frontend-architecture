import type { RemoteDefinition, RuntimeConfig } from '@banking/contracts';

/**
 * Reads the remote registry from the **server** environment, on every request.
 *
 * The variables deliberately carry no `NEXT_PUBLIC_` prefix. Next.js inlines
 * those into the client bundle at build time, which would quietly make the
 * registry a build-time constant — and the whole point of loading remotes at
 * runtime is that repointing `/banking/transfer` at a different build, or
 * rolling it back, is a configuration change rather than a shell rebuild.
 *
 * This module is server-only. The resolved config reaches the browser as a
 * prop, through `ConfigProvider`.
 */
export function readRuntimeConfig(): RuntimeConfig {
  const remotes: RemoteDefinition[] = [
    {
      id: 'dashboard',
      name: 'dashboard',
      entry: process.env.DASHBOARD_REMOTE_ENTRY ?? 'http://localhost:3001/remoteEntry.js',
      module: './mount',
      basePath: '/banking/dashboard',
      requiredPermission: 'VIEW_DASHBOARD',
    },
    {
      id: 'account',
      name: 'account',
      entry: process.env.ACCOUNT_REMOTE_ENTRY ?? 'http://localhost:3002/remoteEntry.js',
      module: './mount',
      basePath: '/banking/accounts',
      requiredPermission: 'VIEW_ACCOUNT',
    },
    {
      id: 'transfer',
      name: 'transfer',
      entry: process.env.TRANSFER_REMOTE_ENTRY ?? 'http://localhost:3003/remoteEntry.js',
      module: './mount',
      basePath: '/banking/transfer',
      requiredPermission: 'TRANSFER_MONEY',
    },
  ];

  return {
    apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000',
    remotes,
  };
}

/**
 * Resolves a URL to the remote that owns it.
 *
 * Longest match first, so `/banking/accounts/acc_1` picks the Account remote
 * and not some shorter prefix that also matches.
 */
export function findRemoteForPath(
  config: RuntimeConfig,
  pathname: string,
): RemoteDefinition | null {
  return (
    [...config.remotes]
      .sort((a, b) => b.basePath.length - a.basePath.length)
      .find((remote) => pathname === remote.basePath || pathname.startsWith(`${remote.basePath}/`)) ??
    null
  );
}
