import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StatusBlock';
import { Panel } from '../../components/Panel';
import { useSpendingOverview } from '../../hooks/use-dashboard-queries';
import { formatMoney, formatPercent, humanise } from '../../utils/format';
import { MonthlyChart } from './MonthlyChart';
import styles from './SpendingOverview.module.css';

const MONTHS = 6;
const TOP_CATEGORIES = 5;

export function SpendingOverview() {
  const { data, isPending, isError, error, refetch } = useSpendingOverview(MONTHS);

  if (isPending) {
    return (
      <Panel title="Spending overview">
        <LoadingBlock label="Loading spending overview" rows={6} />
      </Panel>
    );
  }

  if (isError) {
    return (
      <Panel title="Spending overview">
        <ErrorBlock error={error} onRetry={() => void refetch()} />
      </Panel>
    );
  }

  if (data.totalSpendingMinor === 0 && data.totalIncomeMinor === 0) {
    return (
      <Panel title="Spending overview">
        <EmptyBlock
          title="No activity in this period"
          description={`Nothing was spent or received in the last ${MONTHS} months.`}
        />
      </Panel>
    );
  }

  return (
    <Panel title="Spending overview" hint={`Last ${MONTHS} months`}>
      <div className={styles.headline}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total spending</span>
          <span className={styles.statValue}>
            {formatMoney(data.totalSpendingMinor, data.currency)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total income</span>
          <span className={styles.statValue}>
            {formatMoney(data.totalIncomeMinor, data.currency)}
          </span>
        </div>
      </div>

      <MonthlyChart points={data.monthly} currency={data.currency} />

      <ul className={styles.categories}>
        {data.byCategory.slice(0, TOP_CATEGORIES).map((category) => (
          <li key={category.category} className={styles.category}>
            <span className={styles.categoryName}>
              {humanise(category.category)} · {formatPercent(category.share)}
            </span>
            <span className={styles.categoryAmount}>
              {formatMoney(category.amountMinor, data.currency)}
            </span>
            <span className={styles.track}>
              <span
                className={styles.bar}
                style={{ width: `${Math.max(2, category.share * 100)}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
