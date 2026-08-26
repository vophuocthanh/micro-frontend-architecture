import type { CurrencyCode, MonthlyPoint } from '@banking/contracts';

import a11y from '../../styles/a11y.module.css';
import { formatMoney, formatMonthLabel } from '../../utils/format';
import styles from './MonthlyChart.module.css';

interface MonthlyChartProps {
  points: MonthlyPoint[];
  currency: CurrencyCode;
}

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 120;
const AXIS_HEIGHT = 16;
const BAR_GAP = 3;

/**
 * Income and spending per month, drawn as inline SVG.
 *
 * Hand-drawn rather than pulled from a charting library: a bar chart is about
 * thirty lines of arithmetic, and the smallest capable library would add more
 * to this remote's bundle than the entire rest of the application — a cost the
 * user pays again on every micro frontend that makes the same choice.
 */
export function MonthlyChart({ points, currency }: MonthlyChartProps) {
  const plotHeight = VIEWBOX_HEIGHT - AXIS_HEIGHT;
  const slotWidth = VIEWBOX_WIDTH / Math.max(1, points.length);
  const barWidth = Math.max(2, (slotWidth - BAR_GAP * 3) / 2);

  // Scale to the tallest bar so a quiet period still fills the chart, and guard
  // the all-zero case that would otherwise divide by zero.
  const peak = Math.max(1, ...points.flatMap((point) => [point.incomeMinor, point.spendingMinor]));

  const scale = (amountMinor: number): number => (amountMinor / peak) * (plotHeight - 4);

  return (
    <>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label={`Income and spending over the last ${points.length} months`}
        preserveAspectRatio="none"
      >
        {points.map((point, index) => {
          const slotX = index * slotWidth + BAR_GAP;
          const incomeHeight = scale(point.incomeMinor);
          const spendingHeight = scale(point.spendingMinor);

          return (
            <g key={point.month}>
              <rect
                className={styles.income}
                x={slotX}
                y={plotHeight - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                rx="2"
              />
              <rect
                className={styles.spending}
                x={slotX + barWidth + BAR_GAP}
                y={plotHeight - spendingHeight}
                width={barWidth}
                height={spendingHeight}
                rx="2"
              />
              <text
                className={styles.axis}
                x={slotX + barWidth}
                y={VIEWBOX_HEIGHT - 4}
                textAnchor="middle"
              >
                {formatMonthLabel(point.month)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* The same data as text. An SVG with an `aria-label` says what the chart
          is; this says what it shows, which is what a screen reader user needs. */}
      <ul className={a11y.srOnly}>
        {points.map((point) => (
          <li key={point.month}>
            {formatMonthLabel(point.month)}: income {formatMoney(point.incomeMinor, currency)},
            spending {formatMoney(point.spendingMinor, currency)}
          </li>
        ))}
      </ul>

      <p className={styles.legend}>
        <span>
          <span className={`${styles.swatch} ${styles.swatchIncome}`} aria-hidden="true" />
          Income
        </span>
        <span>
          <span className={`${styles.swatch} ${styles.swatchSpending}`} aria-hidden="true" />
          Spending
        </span>
      </p>
    </>
  );
}
