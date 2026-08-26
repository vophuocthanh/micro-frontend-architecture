'use client';

import type { RuntimeConfig } from '@banking/contracts';
import { createContext, type ReactNode, useContext } from 'react';

const ConfigContext = createContext<RuntimeConfig | null>(null);

/**
 * Carries the server-resolved remote registry into the client tree.
 *
 * The value is read per request by a Server Component and passed down as a
 * prop, so a browser always receives the registry as it is *now* — not as it
 * was when the shell was built.
 */
export function ConfigProvider({
  config,
  children,
}: {
  config: RuntimeConfig;
  children: ReactNode;
}) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useRuntimeConfig(): RuntimeConfig {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error('useRuntimeConfig must be used inside <ConfigProvider>');
  }
  return config;
}
