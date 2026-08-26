/**
 * Every business rule that decides whether money may move, in one place.
 *
 * Isolated from the service so the rules can be unit tested as pure functions,
 * and so a product change ("raise the daily limit") is a single-file diff
 * rather than an archaeology exercise across the transfer flow.
 */
export const TRANSFER_POLICY = {
  /** $1.00 — below this the fee arithmetic stops being meaningful. */
  minAmountMinor: 100,
  /** $10,000.00 per calendar day, across all of a customer's accounts. */
  dailyLimitMinor: 1_000_000,
  /** Transfers up to $1,000.00 are free. */
  freeThresholdMinor: 100_000,
  feeRate: 0.005,
  /** $10.00 — the fee never exceeds this, however large the transfer. */
  feeCapMinor: 1_000,
} as const;

export function calculateFeeMinor(amountMinor: number): number {
  if (amountMinor <= TRANSFER_POLICY.freeThresholdMinor) {
    return 0;
  }

  const fee = Math.round(amountMinor * TRANSFER_POLICY.feeRate);
  return Math.min(fee, TRANSFER_POLICY.feeCapMinor);
}

export function remainingDailyAllowanceMinor(alreadyTransferredMinor: number): number {
  return Math.max(0, TRANSFER_POLICY.dailyLimitMinor - alreadyTransferredMinor);
}
