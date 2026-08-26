/**
 * Monetary amounts cross the wire as integer **minor units** (e.g. 1 USD =
 * 100). Floating point cents silently lose precision once balances grow, and
 * JSON has no decimal type, so the contract never carries a fractional number.
 */
export type MinorUnits = number;

export type CurrencyCode = 'USD' | 'EUR' | 'VND';

/** ISO-8601 timestamp, always UTC. */
export type IsoDateTime = string;

export interface Money {
  amountMinor: MinorUnits;
  currency: CurrencyCode;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * The single error shape every endpoint returns. Frontends branch on `code`,
 * never on the human-readable `message`.
 */
export interface ApiErrorBody {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
  /** Field-level validation failures, keyed by property path. */
  details?: Record<string, string[]>;
  requestId: string;
  timestamp: IsoDateTime;
  path: string;
}

export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'TOKEN_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INSUFFICIENT_FUNDS',
  'ACCOUNT_INACTIVE',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/**
 * Every deployable frontend on the platform. Used to stamp the origin of a
 * cross-application event and of an outbound API request, so a failure can be
 * traced back to the application that caused it.
 */
export const APP_IDS = ['shell', 'dashboard', 'account', 'transfer'] as const;

export type AppId = (typeof APP_IDS)[number];

/** Ids of the applications the shell loads at runtime — the shell is the host. */
export type RemoteAppId = Exclude<AppId, 'shell'>;
