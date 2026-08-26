import type { CurrencyCode, IsoDateTime, MinorUnits, PageQuery } from './common.js';

export const TRANSACTION_DIRECTIONS = ['DEBIT', 'CREDIT'] as const;
export type TransactionDirection = (typeof TRANSACTION_DIRECTIONS)[number];

export const TRANSACTION_CATEGORIES = [
  'GROCERIES',
  'TRANSPORT',
  'UTILITIES',
  'ENTERTAINMENT',
  'HEALTHCARE',
  'SALARY',
  'TRANSFER',
  'OTHER',
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export interface Transaction {
  id: string;
  accountId: string;
  direction: TransactionDirection;
  amountMinor: MinorUnits;
  currency: CurrencyCode;
  category: TransactionCategory;
  description: string;
  counterparty: string;
  bookedAt: IsoDateTime;
}

export interface TransactionQuery extends PageQuery {
  accountId?: string;
  category?: TransactionCategory;
  from?: IsoDateTime;
  to?: IsoDateTime;
}

export interface CategorySpending {
  category: TransactionCategory;
  amountMinor: MinorUnits;
  share: number;
}

export interface MonthlyPoint {
  /** `YYYY-MM`. */
  month: string;
  incomeMinor: MinorUnits;
  spendingMinor: MinorUnits;
}

export interface SpendingOverview {
  currency: CurrencyCode;
  periodStart: IsoDateTime;
  periodEnd: IsoDateTime;
  totalSpendingMinor: MinorUnits;
  totalIncomeMinor: MinorUnits;
  byCategory: CategorySpending[];
  monthly: MonthlyPoint[];
}
