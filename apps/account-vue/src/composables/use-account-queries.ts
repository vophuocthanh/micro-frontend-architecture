import type { Account, Beneficiary, CreateBeneficiaryRequest, Paginated, Transaction } from '@banking/contracts';
import { useMutation, useQuery, useQueryClient, type UseQueryReturnType } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { accountApi } from '../services/account.api';
import { accountKeys } from '../services/query-keys';
import { useApi, useShell } from '../shell/shell-context';

const ACCOUNTS_STALE_TIME = 30_000;
const BENEFICIARIES_STALE_TIME = 5 * 60_000;

export function useAccounts(): UseQueryReturnType<Account[], Error> {
  const api = useApi();

  return useQuery({
    queryKey: accountKeys.accounts(),
    queryFn: () => accountApi.listAccounts(api),
    staleTime: ACCOUNTS_STALE_TIME,
  });
}

export function useAccount(accountId: MaybeRefOrGetter<string>): UseQueryReturnType<Account, Error> {
  const api = useApi();

  return useQuery({
    // A getter, not a plain value: the key has to re-evaluate when the route
    // moves to a different account, or the detail view would keep showing the
    // previous one's data.
    queryKey: computed(() => accountKeys.account(toValue(accountId))),
    queryFn: () => accountApi.getAccount(api, toValue(accountId)),
    enabled: computed(() => toValue(accountId).length > 0),
    staleTime: ACCOUNTS_STALE_TIME,
  });
}

export function useAccountTransactions(
  accountId: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
): UseQueryReturnType<Paginated<Transaction>, Error> {
  const api = useApi();

  return useQuery({
    queryKey: computed(() => accountKeys.transactions(toValue(accountId), toValue(page))),
    queryFn: () => accountApi.listTransactions(api, toValue(accountId), toValue(page)),
    enabled: computed(() => toValue(accountId).length > 0),
    // Keeps the previous page on screen while the next one loads, instead of
    // collapsing the table to a spinner on every click.
    placeholderData: (previous) => previous,
  });
}

export function useBeneficiaries(): UseQueryReturnType<Beneficiary[], Error> {
  const api = useApi();

  return useQuery({
    queryKey: accountKeys.beneficiaries(),
    queryFn: () => accountApi.listBeneficiaries(api),
    staleTime: BENEFICIARIES_STALE_TIME,
  });
}

export function useCreateBeneficiary() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { events } = useShell();

  return useMutation({
    mutationFn: (input: CreateBeneficiaryRequest) => accountApi.createBeneficiary(api, input),
    onSuccess: (beneficiary) => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.beneficiaries() });
      // The shell owns global UI; this remote asks for a toast rather than
      // rendering one of its own on top of the shell's layout.
      events.emit('notification:show', {
        level: 'success',
        message: `${beneficiary.fullName} was added to your payees.`,
      });
    },
  });
}

export function useToggleFavourite() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFavourite }: { id: string; isFavourite: boolean }) =>
      accountApi.toggleFavourite(api, id, isFavourite),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.beneficiaries() });
    },
  });
}
