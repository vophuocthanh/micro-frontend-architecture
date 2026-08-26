import { calculateFeeMinor, remainingDailyAllowanceMinor, TRANSFER_POLICY } from './transfer.policy';

describe('calculateFeeMinor', () => {
  it('charges nothing up to and including the free threshold', () => {
    expect(calculateFeeMinor(TRANSFER_POLICY.freeThresholdMinor)).toBe(0);
    expect(calculateFeeMinor(TRANSFER_POLICY.minAmountMinor)).toBe(0);
  });

  it('charges the rate above the threshold', () => {
    // $1,500.00 → 0.5% = $7.50
    expect(calculateFeeMinor(150_000)).toBe(750);
  });

  it('never exceeds the cap, however large the transfer', () => {
    expect(calculateFeeMinor(10_000_000)).toBe(TRANSFER_POLICY.feeCapMinor);
  });

  it('crosses the threshold by exactly one minor unit without jumping', () => {
    // The boundary is where an off-by-one turns a free transfer into a charged
    // one; the fee here must be the rate, not the cap.
    const justOver = TRANSFER_POLICY.freeThresholdMinor + 1;
    expect(calculateFeeMinor(justOver)).toBe(Math.round(justOver * TRANSFER_POLICY.feeRate));
  });

  it('returns whole minor units, never a fraction', () => {
    // 0.5% of $1,000.01 is 500.005 minor units — a fraction of a cent cannot be
    // charged, and a float here would eventually corrupt a ledger total.
    expect(Number.isInteger(calculateFeeMinor(100_001))).toBe(true);
  });
});

describe('remainingDailyAllowanceMinor', () => {
  it('reports the full limit when nothing has been sent', () => {
    expect(remainingDailyAllowanceMinor(0)).toBe(TRANSFER_POLICY.dailyLimitMinor);
  });

  it('never reports a negative allowance', () => {
    // A limit lowered after transfers were already made must clamp at zero,
    // not hand the customer a negative number the UI would render as credit.
    expect(remainingDailyAllowanceMinor(TRANSFER_POLICY.dailyLimitMinor * 2)).toBe(0);
  });

  it('is exhausted exactly at the limit', () => {
    expect(remainingDailyAllowanceMinor(TRANSFER_POLICY.dailyLimitMinor)).toBe(0);
  });
});
