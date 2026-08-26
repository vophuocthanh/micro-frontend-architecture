import type { AuthenticatedUser, MfeMountContext, Permission } from '@banking/contracts';
import { createEventBus } from '@banking/contracts';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { defineComponent, h, type Component } from 'vue';

import { provideShell } from '../shell/shell-context';

const TEST_USER: AuthenticatedUser = {
  id: 'user_1',
  email: 'customer@bank.test',
  fullName: 'Alex Customer',
  role: 'CUSTOMER',
  permissions: ['VIEW_DASHBOARD', 'VIEW_ACCOUNT', 'VIEW_TRANSACTION', 'TRANSFER_MONEY', 'MANAGE_BENEFICIARY'],
};

export interface Harness {
  context: MfeMountContext;
  emitted: Array<{ type: string; payload: unknown }>;
  navigated: string[];
}

/**
 * Builds the context the shell supplies at mount time, so components are
 * exercised through the real contract rather than a mocked module — a change to
 * the contract then breaks these tests, which is the point.
 */
export function createHarness(permissions: Permission[] = TEST_USER.permissions): Harness {
  const emitted: Harness['emitted'] = [];
  const navigated: string[] = [];

  return {
    emitted,
    navigated,
    context: {
      auth: {
        user: { ...TEST_USER, permissions },
        getAccessToken: () => Promise.resolve('test-token'),
        hasPermission: (permission) => permissions.includes(permission),
      },
      events: createEventBus({
        source: 'account',
        onEmit: (event) => emitted.push({ type: event.type, payload: event.payload }),
      }),
      navigate: (path) => navigated.push(path),
      basePath: '/banking/accounts',
      route: { current: () => '/', subscribe: () => () => undefined },
      apiBaseUrl: 'http://api.test',
      locale: 'en-US',
      theme: 'light',
    },
  };
}

export function mountInShell(component: Component, harness: Harness): VueWrapper {
  const Root = defineComponent({
    setup() {
      provideShell(harness.context);
      return () => h(component);
    },
  });

  const queryClient = new QueryClient({
    // Retries would make a deliberate failure test wait for doomed attempts.
    defaultOptions: { queries: { retry: false } },
  });

  return mount(Root, {
    global: { plugins: [createPinia(), [VueQueryPlugin, { queryClient }]] },
  });
}

/** Lets pending query promises and the resulting re-render settle. */
export async function settle(): Promise<void> {
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
