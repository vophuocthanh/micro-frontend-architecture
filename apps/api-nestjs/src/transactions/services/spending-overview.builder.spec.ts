import { Prisma } from '@prisma/client';

import type { CategoryTotal, MonthlyTotalRow } from '../repositories/transactions.repository';
import { buildSpendingOverview } from './spending-overview.builder';

const decimal = (value: string): Prisma.Decimal => new Prisma.Decimal(value);

const period = {
  periodStart: new Date(Date.UTC(2026, 0, 1)),
  periodEnd: new Date(Date.UTC(2026, 2, 15)),
};

describe('buildSpendingOverview', () => {
  it('totals debits as spending and credits as income', () => {
    const overview = buildSpendingOverview({
      ...period,
      categoryTotals: [
        { category: 'GROCERIES', direction: 'DEBIT', total: decimal('120.50') },
        { category: 'SALARY', direction: 'CREDIT', total: decimal('5200.00') },
      ],
      monthlyTotals: [],
    });

    expect(overview.totalSpendingMinor).toBe(12_050);
    expect(overview.totalIncomeMinor).toBe(520_000);
    // Income must not appear as a spending category, or the pie chart lies.
    expect(overview.byCategory.map((entry) => entry.category)).toEqual(['GROCERIES']);
  });

  it('orders categories by amount, largest first', () => {
    const overview = buildSpendingOverview({
      ...period,
      categoryTotals: [
        { category: 'TRANSPORT', direction: 'DEBIT', total: decimal('40.00') },
        { category: 'UTILITIES', direction: 'DEBIT', total: decimal('210.00') },
        { category: 'GROCERIES', direction: 'DEBIT', total: decimal('120.00') },
      ],
      monthlyTotals: [],
    });

    expect(overview.byCategory.map((entry) => entry.category)).toEqual([
      'UTILITIES',
      'GROCERIES',
      'TRANSPORT',
    ]);
    expect(overview.byCategory[0]?.share).toBeCloseTo(210 / 370, 5);
  });

  it('reports a zero share rather than NaN when nothing was spent', () => {
    // Dividing by a zero total is the bug that renders every chart segment
    // blank; the guard has to hold even with a category row present.
    const overview = buildSpendingOverview({
      ...period,
      categoryTotals: [{ category: 'GROCERIES', direction: 'DEBIT', total: decimal('0') }],
      monthlyTotals: [],
    });

    expect(overview.byCategory[0]?.share).toBe(0);
    expect(Number.isNaN(overview.byCategory[0]?.share)).toBe(false);
  });

  it('emits one point per month in the period, including empty months', () => {
    // February has no activity. Omitting it would leave a gap in the x-axis and
    // make January's bar sit next to March's as though they were adjacent.
    const monthlyTotals: MonthlyTotalRow[] = [
      { month: '2026-01', direction: 'DEBIT', total: decimal('100.00') },
      { month: '2026-03', direction: 'CREDIT', total: decimal('300.00') },
    ];

    const overview = buildSpendingOverview({ ...period, categoryTotals: [], monthlyTotals });

    expect(overview.monthly.map((point) => point.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(overview.monthly[1]).toEqual({ month: '2026-02', incomeMinor: 0, spendingMinor: 0 });
    expect(overview.monthly[2]?.incomeMinor).toBe(30_000);
  });

  it('returns an empty period without throwing', () => {
    const overview = buildSpendingOverview({
      periodStart: period.periodStart,
      periodEnd: period.periodStart,
      categoryTotals: [] as CategoryTotal[],
      monthlyTotals: [],
    });

    expect(overview.totalSpendingMinor).toBe(0);
    expect(overview.byCategory).toEqual([]);
    expect(overview.monthly).toHaveLength(1);
  });
});
