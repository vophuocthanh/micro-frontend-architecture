import { Prisma } from '@prisma/client';

/**
 * The boundary between the database's `Decimal` and the wire's integer minor
 * units.
 *
 * Keeping the conversion in one place is what stops a stray `Number(decimal)`
 * from leaking a float into a balance: every amount that reaches a browser has
 * passed through `toMinorUnits`, and every amount that reaches Postgres has
 * passed through `toDecimal`.
 */
const MINOR_UNITS_PER_MAJOR = 100;

export function toMinorUnits(amount: Prisma.Decimal): number {
  return amount.mul(MINOR_UNITS_PER_MAJOR).toNumber();
}

export function toDecimal(minorUnits: number): Prisma.Decimal {
  return new Prisma.Decimal(minorUnits).div(MINOR_UNITS_PER_MAJOR);
}

export function sumDecimals(amounts: Prisma.Decimal[]): Prisma.Decimal {
  return amounts.reduce((total, amount) => total.add(amount), new Prisma.Decimal(0));
}
