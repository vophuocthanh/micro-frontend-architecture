import type { MfeMountContext, MfeUnmount } from '@banking/contracts';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { createApp, defineComponent, h } from 'vue';

import App from './App.vue';
import { ApiError } from './services/api-client';
import { provideShell } from './shell/shell-context';

/**
 * Starts the Vue application inside an element the caller owns.
 *
 * Kept separate from `mount.ts` on purpose. `mount.ts` is the module Module
 * Federation virtualises, and letting the standalone entry import from it too
 * gives the bundler two routes into the same module — a race that surfaces as
 * an intermittent "mount is not exported" at build time. Both entry points
 * depend on *this* module instead, and the federation boundary stays a boundary.
 */
export function bootstrapAccount(element: HTMLElement, context: MfeMountContext): MfeUnmount {
  const queryClient = createQueryClient();

  // A wrapper component is the only place `provide` may be called; it keeps the
  // injection key and its API client construction in one module.
  const Root = defineComponent({
    name: 'AccountRoot',
    setup() {
      provideShell(context);
      return () => h(App);
    },
  });

  const app = createApp(Root);
  // A Pinia instance per mount, not a module-level singleton: two mounts, or a
  // remount after logout, must not inherit the previous instance's state.
  app.use(createPinia());
  app.use(VueQueryPlugin, { queryClient });
  app.mount(element);

  return () => {
    app.unmount();
    queryClient.clear();
  };
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.statusCode < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}
