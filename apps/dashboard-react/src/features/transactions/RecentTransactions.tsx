import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StatusBlock';
import { Panel } from '../../components/Panel';
import { useRecentTransactions } from '../../hooks/use-dashboard-queries';
import { formatMoney, formatShortDate, humanise } from '../../utils/format';
import styles from './RecentTransactions.module.css';

const VISIBLE_COUNT = 8;

export function RecentTransactions() {
  const { data, isPending, isError, error, refetch } = useRecentTransactions(VISIBLE_COUNT);

  if (isPending) {
    return (
      <Panel title="Recent activity">
        <LoadingBlock label="Loading recent transactions" rows={5} />
      </Panel>
    );
  }

  if (isError) {
    return (
      <Panel title="Recent activity">
        <ErrorBlock error={error} onRetry={() => void refetch()} />
      </Panel>
    );
  }

  if (data.length === 0) {
    return (
      <Panel title="Recent activity">
        <EmptyBlock
          title="Nothing yet"
          description="Transactions appear here as soon as money moves in or out of an account."
        />
      </Panel>
    );
  }

  return (
    <Panel title="Recent activity" hint={`Last ${data.length}`}>
      <ul className={styles.list}>
        {data.map((transaction) => {
          const isCredit = transaction.direction === 'CREDIT';

          return (
            <li key={transaction.id} className={styles.row}>
              <span className={styles.details}>
                <span className={styles.counterparty}>{transaction.counterparty}</span>
                <span className={styles.meta}>
                  {humanise(transaction.category)} · {formatShortDate(transaction.bookedAt)}
                </span>
              </span>
              <span className={`${styles.amount} ${isCredit ? styles.credit : styles.debit}`}>
                {/* The sign carries the meaning for anyone who cannot rely on the
                    green/black distinction alone. */}
                {isCredit ? '+' : '−'}
                {formatMoney(transaction.amountMinor, transaction.currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
