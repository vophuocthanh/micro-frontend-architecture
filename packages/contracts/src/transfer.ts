import type { CurrencyCode, IsoDateTime, MinorUnits, PageQuery } from './common.js';

export const TRANSFER_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export interface Transfer {
  id: string;
  reference: string;
  sourceAccountId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  amountMinor: MinorUnits;
  currency: CurrencyCode;
  note: string | null;
  status: TransferStatus;
  failureReason: string | null;
  createdAt: IsoDateTime;
}

export interface CreateTransferRequest {
  sourceAccountId: string;
  beneficiaryId: string;
  amountMinor: MinorUnits;
  note?: string;
  /**
   * Client-generated UUID. Replaying the same key returns the original
   * transfer instead of moving money twice, which makes the retry that a
   * flaky network forces on the user safe.
   */
  idempotencyKey: string;
}

/** Server-side preview of a transfer: fees and limits before money moves. */
export interface TransferQuoteRequest {
  sourceAccountId: string;
  beneficiaryId: string;
  amountMinor: MinorUnits;
}

export interface TransferQuote {
  amountMinor: MinorUnits;
  feeMinor: MinorUnits;
  totalMinor: MinorUnits;
  currency: CurrencyCode;
  sourceAvailableAfterMinor: MinorUnits;
  dailyRemainingMinor: MinorUnits;
}

export interface TransferQuery extends PageQuery {
  status?: TransferStatus;
}
