import type { MfeMountContext } from '@banking/contracts';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { ApiClient } from '../services/api-client';

interface ShellValue {
  shell: MfeMountContext;
  api: ApiClient;
}

const ShellContext = createContext<ShellValue | null>(null);

interface ShellProviderProps {
  context: MfeMountContext;
  children: ReactNode;
}

/**
 * Makes the capabilities the shell lent us available to the whole subtree.
 *
 * Deliberately a React context rather than a module-level singleton: the shell
 * can mount this remote twice (or remount it after an error) and each instance
 * gets its own context, with no state surviving an unmount.
 */
export function ShellProvider({ context, children }: ShellProviderProps) {
  const value = useMemo<ShellValue>(
    () => ({
      shell: context,
      api: new ApiClient({
        baseUrl: context.apiBaseUrl,
        getAccessToken: () => context.auth.getAccessToken(),
      }),
    }),
    [context],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): MfeMountContext {
  return useShellValue().shell;
}

export function useApi(): ApiClient {
  return useShellValue().api;
}

function useShellValue(): ShellValue {
  const value = useContext(ShellContext);
  if (!value) {
    throw new Error('Dashboard components must be rendered inside <ShellProvider>');
  }
  return value;
}
