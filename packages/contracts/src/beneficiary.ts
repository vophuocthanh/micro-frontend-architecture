import type { CurrencyCode, IsoDateTime } from './common.js';

export interface Beneficiary {
  id: string;
  fullName: string;
  /** Masked in every response. */
  accountNumber: string;
  bankName: string;
  currency: CurrencyCode;
  isFavourite: boolean;
  createdAt: IsoDateTime;
}

export interface CreateBeneficiaryRequest {
  fullName: string;
  accountNumber: string;
  bankName: string;
  currency: CurrencyCode;
}

export interface UpdateBeneficiaryRequest {
  fullName?: string;
  bankName?: string;
  isFavourite?: boolean;
}
