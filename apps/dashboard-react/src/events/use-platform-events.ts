import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { dashboardKeys } from '../services/query-keys';
import { useShell } from '../shell/shell-context';

/**
 * Reacts to things that happened in *other* micro frontends.
 *
 * The Angular Transfer application moves money and publishes
 * `transfer:completed`. This application knows nothing about Angular, about
 * Transfer's state, or even that Transfer exists — it knows the event contract,
 * and that a completed transfer makes its cached balance wrong.
 */
export function usePlatformEvents(): void {
  const { events } = useShell();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = events.on('transfer:completed', () => {
      // Invalidate the whole domain by prefix: the balance, the recent list and
      // the spending charts are all affected, and naming them individually here
      // would mean updating this line every time a new query is added.
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    });

    // Returning the unsubscribe is what keeps a remount from stacking listeners
    // — an unmounted Dashboard must go completely quiet.
    return unsubscribe;
  }, [events, queryClient]);
}
