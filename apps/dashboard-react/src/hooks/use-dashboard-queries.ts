import type { AccountSummary, SpendingOverview, Transaction } from '@banking/contracts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { dashboardApi } from '../services/dashboard.api';
import { dashboardKeys } from '../services/query-keys';
import { useApi } from '../shell/shell-context';

/**
 * `staleTime` per query, chosen from how fast the underlying data actually
 * moves. A blanket zero would make every tab switch re-fetch six months of
 * chart data; a blanket hour would show a stale balance right after a transfer.
 */
const BALANCE_STALE_TIME = 30_000;
const TRANSACTIONS_STALE_TIME = 60_000;
const OVERVIEW_STALE_TIME = 5 * 60_000;

export function useAccountSummary(): UseQueryResult<AccountSummary, Error> {
  const api = useApi();

  return useQuery({
    queryKey: dashboardKeys.accountSummary(),
    queryFn: () => dashboardApi.getAccountSummary(api),
    staleTime: BALANCE_STALE_TIME,
  });
}

export function useRecentTransactions(limit = 8): UseQueryResult<Transaction[], Error> {
  const api = useApi();

  return useQuery({
    queryKey: dashboardKeys.recentTransactions(limit),
    queryFn: () => dashboardApi.getRecentTransactions(api, limit),
    staleTime: TRANSACTIONS_STALE_TIME,
  });
}

export function useSpendingOverview(months = 6): UseQueryResult<SpendingOverview, Error> {
  const api = useApi();

  return useQuery({
    queryKey: dashboardKeys.spendingOverview(months),
    queryFn: () => dashboardApi.getSpendingOverview(api, months),
    staleTime: OVERVIEW_STALE_TIME,
  });
}
