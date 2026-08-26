/**
 * One factory for every cache key this application uses.
 *
 * Centralising them is what makes a broad invalidation safe: after a transfer
 * completes, `invalidateQueries({ queryKey: dashboardKeys.all })` refreshes the
 * balance, the recent list and the charts without any of them naming each other.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  accountSummary: () => [...dashboardKeys.all, 'account-summary'] as const,
  recentTransactions: (limit: number) => [...dashboardKeys.all, 'recent-transactions', limit] as const,
  spendingOverview: (months: number) => [...dashboardKeys.all, 'spending-overview', months] as const,
};
