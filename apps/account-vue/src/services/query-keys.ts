export const accountKeys = {
  all: ['account'] as const,
  accounts: () => [...accountKeys.all, 'accounts'] as const,
  account: (id: string) => [...accountKeys.accounts(), id] as const,
  beneficiaries: () => [...accountKeys.all, 'beneficiaries'] as const,
  transactions: (accountId: string, page: number) =>
    [...accountKeys.all, 'transactions', accountId, page] as const,
};
