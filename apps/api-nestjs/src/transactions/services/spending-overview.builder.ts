import type { CategorySpending, MonthlyPoint, SpendingOverview } from '@banking/contracts';
import { Prisma } from '@prisma/client';

import { toMinorUnits } from '../../common/money/money';
import type { CategoryTotal, MonthlyTotalRow } from '../repositories/transactions.repository';

/**
 * Turns two aggregate queries into the shape the dashboard charts consume.
 *
 * Kept out of the service because it is pure arithmetic over plain data: it can
 * be unit tested without a database, and the service stays a thin orchestrator.
 */
export function buildSpendingOverview(input: {
  periodStart: Date;
  periodEnd: Date;
  categoryTotals: CategoryTotal[];
  monthlyTotals: MonthlyTotalRow[];
}): SpendingOverview {
  const spendingByCategory = input.categoryTotals.filter((row) => row.direction === 'DEBIT');

  const totalSpendingMinor = spendingByCategory.reduce(
    (total, row) => total + toMinorUnits(row.total),
    0,
  );
  const totalIncomeMinor = input.categoryTotals
    .filter((row) => row.direction === 'CREDIT')
    .reduce((total, row) => total + toMinorUnits(row.total), 0);

  const byCategory: CategorySpending[] = spendingByCategory
    .map((row) => {
      const amountMinor = toMinorUnits(row.total);
      return {
        category: row.category,
        amountMinor,
        // Guarded: a period with no spending must yield 0, not NaN, or every
        // chart downstream renders a blank segment.
        share: totalSpendingMinor === 0 ? 0 : amountMinor / totalSpendingMinor,
      };
    })
    .sort((a, b) => b.amountMinor - a.amountMinor);

  return {
    currency: 'USD',
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    totalSpendingMinor,
    totalIncomeMinor,
    byCategory,
    monthly: buildMonthlySeries(input.monthlyTotals, input.periodStart, input.periodEnd),
  };
}

/**
 * Emits one point per month in the period, including months with no activity —
 * a chart with gaps in its x-axis misleads far more than a flat line does.
 */
function buildMonthlySeries(rows: MonthlyTotalRow[], from: Date, to: Date): MonthlyPoint[] {
  const totals = new Map<string, { incomeMinor: number; spendingMinor: number }>();

  for (const row of rows) {
    const bucket = totals.get(row.month) ?? { incomeMinor: 0, spendingMinor: 0 };
    const amountMinor = toMinorUnits(new Prisma.Decimal(row.total));

    if (row.direction === 'CREDIT') {
      bucket.incomeMinor += amountMinor;
    } else {
      bucket.spendingMinor += amountMinor;
    }
    totals.set(row.month, bucket);
  }

  const series: MonthlyPoint[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));

  while (cursor <= to) {
    const month = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
    const bucket = totals.get(month) ?? { incomeMinor: 0, spendingMinor: 0 };
    series.push({ month, ...bucket });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return series;
}
