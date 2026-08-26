import type {
  Account,
  Beneficiary,
  CreateBeneficiaryRequest,
  Paginated,
  Transaction,
} from '@banking/contracts';

import type { ApiClient } from './api-client';

export const accountApi = {
  listAccounts: (client: ApiClient): Promise<Account[]> => client.get<Account[]>('/accounts'),

  getAccount: (client: ApiClient, id: string): Promise<Account> =>
    client.get<Account>(`/accounts/${id}`),

  renameAccount: (client: ApiClient, id: string, nickname: string): Promise<Account> =>
    client.patch<Account>(`/accounts/${id}`, { nickname }),

  listBeneficiaries: (client: ApiClient): Promise<Beneficiary[]> =>
    client.get<Beneficiary[]>('/beneficiaries'),

  createBeneficiary: (client: ApiClient, input: CreateBeneficiaryRequest): Promise<Beneficiary> =>
    client.post<Beneficiary>('/beneficiaries', { ...input }),

  toggleFavourite: (client: ApiClient, id: string, isFavourite: boolean): Promise<Beneficiary> =>
    client.patch<Beneficiary>(`/beneficiaries/${id}`, { isFavourite }),

  deleteBeneficiary: (client: ApiClient, id: string): Promise<void> =>
    client.delete(`/beneficiaries/${id}`),

  listTransactions: (
    client: ApiClient,
    accountId: string,
    page: number,
  ): Promise<Paginated<Transaction>> =>
    client.get<Paginated<Transaction>>('/transactions', { accountId, page, pageSize: 10 }),
};
