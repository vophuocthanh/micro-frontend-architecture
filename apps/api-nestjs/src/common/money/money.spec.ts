import { Prisma } from '@prisma/client';

import { sumDecimals, toDecimal, toMinorUnits } from './money';

describe('money conversion', () => {
  it('converts a decimal balance to integer minor units', () => {
    expect(toMinorUnits(new Prisma.Decimal('8450.35'))).toBe(845_035);
  });

  it('round-trips without drift', () => {
    // 0.1 + 0.2 is the canonical float failure; the decimal path must not
    // reproduce it at any point in the conversion.
    expect(toMinorUnits(toDecimal(10))).toBe(10);
    expect(toMinorUnits(toDecimal(845_035))).toBe(845_035);
  });

  it('handles zero and whole currency units', () => {
    expect(toMinorUnits(new Prisma.Decimal(0))).toBe(0);
    expect(toMinorUnits(new Prisma.Decimal(100))).toBe(10_000);
  });

  it('sums decimals exactly', () => {
    const total = sumDecimals([
      new Prisma.Decimal('0.10'),
      new Prisma.Decimal('0.20'),
      new Prisma.Decimal('0.30'),
    ]);
    expect(total.toString()).toBe('0.6');
  });
});
