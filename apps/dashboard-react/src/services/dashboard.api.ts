import type { AccountSummary, SpendingOverview, Transaction } from '@banking/contracts';

import type { ApiClient } from './api-client';

/**
 * Every network call this domain makes, in one module.
 *
 * Query functions stay out of components so the same call can be reused by a
 * hook, a prefetch and a test without three slightly different fetch bodies
 * drifting apart.
 */
export const dashboardApi = {
  getAccountSummary: (client: ApiClient): Promise<AccountSummary> =>
    client.get<AccountSummary>('/accounts/summary'),

  getRecentTransactions: (client: ApiClient, limit: number): Promise<Transaction[]> =>
    client.get<Transaction[]>('/transactions/recent', { limit }),

  getSpendingOverview: (client: ApiClient, months: number): Promise<SpendingOverview> =>
    client.get<SpendingOverview>('/transactions/spending-overview', { months }),
};
