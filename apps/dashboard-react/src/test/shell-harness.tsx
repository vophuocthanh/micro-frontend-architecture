import type { AuthenticatedUser, MfeMountContext, Permission } from '@banking/contracts';
import { createEventBus } from '@banking/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

import { ShellProvider } from '../shell/shell-context';

const TEST_USER: AuthenticatedUser = {
  id: 'user_1',
  email: 'customer@bank.test',
  fullName: 'Alex Customer',
  role: 'CUSTOMER',
  permissions: ['VIEW_DASHBOARD', 'VIEW_ACCOUNT', 'VIEW_TRANSACTION', 'TRANSFER_MONEY'],
};

export interface Harness {
  context: MfeMountContext;
  emitted: Array<{ type: string; payload: unknown }>;
  /** Hand-offs to another application, in the order they were requested. */
  handedOff: Array<{ app: string; subPath: string | undefined }>;
}

/**
 * Builds the shell context a remote is given at mount time.
 *
 * Tests exercise the component through the real contract rather than a mocked
 * module, so a change to the contract breaks them — which is the point: the
 * contract is the thing that must not drift.
 */
export function createHarness(permissions: Permission[] = TEST_USER.permissions): Harness {
  const emitted: Harness['emitted'] = [];
  const handedOff: Harness['handedOff'] = [];

  return {
    emitted,
    handedOff,
    context: {
      auth: {
        user: { ...TEST_USER, permissions },
        getAccessToken: () => Promise.resolve('test-token'),
        hasPermission: (permission) => permissions.includes(permission),
      },
      events: createEventBus({
        source: 'dashboard',
        onEmit: (event) => emitted.push({ type: event.type, payload: event.payload }),
      }),
      navigate: () => undefined,
      navigateToApp: (app, subPath) => handedOff.push({ app, subPath }),
      basePath: '/banking/dashboard',
      route: { current: () => '/', subscribe: () => () => undefined },
      apiBaseUrl: 'http://api.test',
      locale: 'en-US',
      theme: 'light',
    },
  };
}

export function renderInShell(ui: ReactElement, harness: Harness): RenderResult {
  const queryClient = new QueryClient({
    // Retries would make a deliberate failure test wait for two doomed attempts.
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ShellProvider context={harness.context}>{ui}</ShellProvider>
    </QueryClientProvider>,
  );
}
