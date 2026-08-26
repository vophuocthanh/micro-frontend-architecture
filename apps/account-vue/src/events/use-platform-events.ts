import { useQueryClient } from '@tanstack/vue-query';
import { onScopeDispose } from 'vue';

import { accountKeys } from '../services/query-keys';
import { useShell } from '../shell/shell-context';

/**
 * Keeps this domain's cached data honest when another application changes it.
 *
 * A transfer initiated in the Angular remote debits an account this remote is
 * displaying. Neither application imports the other; the event contract is the
 * only thing they share.
 */
export function usePlatformEvents(): void {
  const { events } = useShell();
  const queryClient = useQueryClient();

  const unsubscribe = events.on('transfer:completed', () => {
    void queryClient.invalidateQueries({ queryKey: accountKeys.accounts() });
  });

  onScopeDispose(unsubscribe);
}
