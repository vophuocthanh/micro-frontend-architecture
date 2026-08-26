import type { MfeMountContext } from '@banking/contracts';
import { inject, type InjectionKey, provide } from 'vue';

import { ApiClient } from '../services/api-client';

export interface ShellValue {
  shell: MfeMountContext;
  api: ApiClient;
}

/**
 * A typed injection key rather than a string: `inject(SHELL_KEY)` returns
 * `ShellValue | undefined` with no cast, so a component that forgets to be
 * mounted under the provider fails at compile time rather than at runtime.
 */
const SHELL_KEY: InjectionKey<ShellValue> = Symbol('banking.shell');

export function provideShell(context: MfeMountContext): void {
  provide(SHELL_KEY, {
    shell: context,
    api: new ApiClient({
      baseUrl: context.apiBaseUrl,
      getAccessToken: () => context.auth.getAccessToken(),
    }),
  });
}

export function useShell(): MfeMountContext {
  return useShellValue().shell;
}

export function useApi(): ApiClient {
  return useShellValue().api;
}

function useShellValue(): ShellValue {
  const value = inject(SHELL_KEY);
  if (!value) {
    throw new Error('Account components must be rendered inside the shell provider');
  }
  return value;
}
