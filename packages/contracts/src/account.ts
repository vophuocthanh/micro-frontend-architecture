import type { CurrencyCode, IsoDateTime, MinorUnits } from './common.js';

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CREDIT'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_STATUSES = ['ACTIVE', 'FROZEN', 'CLOSED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface Account {
  id: string;
  /** Masked in every response — the full number is never sent to a browser. */
  accountNumber: string;
  nickname: string;
  type: AccountType;
  status: AccountStatus;
  balanceMinor: MinorUnits;
  availableBalanceMinor: MinorUnits;
  currency: CurrencyCode;
  openedAt: IsoDateTime;
}

export interface AccountSummary {
  totalBalanceMinor: MinorUnits;
  currency: CurrencyCode;
  accountCount: number;
  accounts: Account[];
}

export interface UpdateAccountRequest {
  nickname: string;
}
