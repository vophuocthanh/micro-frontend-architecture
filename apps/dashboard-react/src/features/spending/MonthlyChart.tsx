import type { CurrencyCode, MonthlyPoint } from '@banking/contracts';

import { formatMoney, formatMonthLabel } from '../../utils/format';

interface MonthlyChartProps {
  points: MonthlyPoint[];
  currency: CurrencyCode;
}

/** Keeps a non-zero month from rendering as an invisible sliver. */
const MIN_BAR_PERCENT = 2;

/**
 * Income and spending per month.
 *
 * Drawn with flex columns rather than SVG, and rather than a charting library.
 *
 * No library, because a bar chart is a division and a percentage — the smallest
 * capable library would add more to this remote's bundle than the rest of the
 * application, a cost every micro frontend making the same choice pays again.
 *
 * No SVG, because a `viewBox` scales its text along with its geometry: stretched
 * across a wide card the month labels grow to headline size. Percentage heights
 * on real elements size themselves to the container while the type stays at the
 * size the design system says it should be.
 */
export function MonthlyChart({ points, currency }: MonthlyChartProps) {
  // Scale to the tallest bar so a quiet period still fills the chart, and guard
  // the all-zero case that would otherwise divide by zero.
  const peak = Math.max(1, ...points.flatMap((point) => [point.incomeMinor, point.spendingMinor]));

  const height = (amountMinor: number): string =>
    `${amountMinor === 0 ? 0 : Math.max(MIN_BAR_PERCENT, (amountMinor / peak) * 100)}%`;

  return (
    <figure className="dash:m-0">
      <div className="dash:flex dash:h-40 dash:items-end dash:gap-2" aria-hidden="true">
        {points.map((point) => (
          <div key={point.month} className="dash:flex dash:h-full dash:flex-1 dash:flex-col">
            <div className="dash:flex dash:flex-1 dash:items-end dash:justify-center dash:gap-1">
              <span
                className="dash:w-1/2 dash:max-w-8 dash:rounded-t-sm"
                style={{ height: height(point.incomeMinor), background: 'var(--chart-2)' }}
              />
              <span
                className="dash:w-1/2 dash:max-w-8 dash:rounded-t-sm"
                style={{ height: height(point.spendingMinor), background: 'var(--chart-1)' }}
              />
            </div>
            <span className="dash:text-muted-foreground dash:mt-2 dash:text-center dash:text-xs">
              {formatMonthLabel(point.month)}
            </span>
          </div>
        ))}
      </div>

      {/* The bars are decorative to assistive tech; this is the actual data. */}
      <figcaption className="dash:sr-only">
        Income and spending over the last {points.length} months.
        <ul>
          {points.map((point) => (
            <li key={point.month}>
              {formatMonthLabel(point.month)}: income {formatMoney(point.incomeMinor, currency)},
              spending {formatMoney(point.spendingMinor, currency)}
            </li>
          ))}
        </ul>
      </figcaption>

      <p className="dash:text-muted-foreground dash:mt-3 dash:flex dash:gap-4 dash:text-xs">
        <span className="dash:flex dash:items-center dash:gap-1.5">
          <span
            className="dash:size-2.5 dash:rounded-sm"
            style={{ background: 'var(--chart-2)' }}
            aria-hidden="true"
          />
          Income
        </span>
        <span className="dash:flex dash:items-center dash:gap-1.5">
          <span
            className="dash:size-2.5 dash:rounded-sm"
            style={{ background: 'var(--chart-1)' }}
            aria-hidden="true"
          />
          Spending
        </span>
      </p>
    </figure>
  );
}
