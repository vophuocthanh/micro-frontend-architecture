import type { MfeMountContext, MfeUnmount } from '@banking/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { ApiError } from './services/api-client';
import { ShellProvider } from './shell/shell-context';
import './styles/dashboard.css';

/**
 * Starts the React application inside an element the caller owns.
 *
 * Kept separate from `mount.tsx` on purpose. `mount.tsx` is the module Module
 * Federation virtualises, and letting the standalone entry import from it too
 * gives the bundler two routes into the same module — a race that surfaces as
 * an intermittent "mount is not exported" at build time. Both entry points
 * depend on *this* module instead, and the federation boundary stays a boundary.
 */
export function bootstrapDashboard(
  element: HTMLElement,
  context: MfeMountContext,
): MfeUnmount {
  const queryClient = createQueryClient();
  const root = createRoot(element);

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ShellProvider context={context}>
          {/*
            Every semantic token this remote uses is defined on this class
            rather than on `:root`, so the remote cannot repaint the shell by
            declaring a variable of the same name. See styles/dashboard.css.
          */}
          <div className="banking-dashboard">
            <App />
          </div>
        </ShellProvider>
      </QueryClientProvider>
    </StrictMode>,
  );

  return () => {
    root.unmount();
    // The cache is per-mount. Leaving it behind would let a second user, after
    // a logout and login in the same tab, briefly see the first one's balances.
    queryClient.clear();
  };
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retrying a 401 or a 403 cannot succeed and only delays the error the
        // user needs to see; a 5xx or a dropped connection is worth two tries.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.statusCode < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}
