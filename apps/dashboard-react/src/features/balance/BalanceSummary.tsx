import type { Account } from '@banking/contracts';

import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StatusBlock';
import { Panel } from '../../components/Panel';
import { useAccountSummary } from '../../hooks/use-dashboard-queries';
import { useShell } from '../../shell/shell-context';
import { formatMoney } from '../../utils/format';
import styles from './BalanceSummary.module.css';

/**
 * Total assets plus a per-account breakdown.
 *
 * Selecting an account publishes `account:selected` rather than navigating
 * directly: the Transfer application listens for it and pre-fills its source
 * account, and neither application has to know the other exists.
 */
export function BalanceSummary() {
  const { events } = useShell();
  const { data, isPending, isError, error, refetch } = useAccountSummary();

  if (isPending) return <Panel title="Total assets"><LoadingBlock label="Loading balances" rows={4} /></Panel>;
  if (isError) return <Panel title="Total assets"><ErrorBlock error={error} onRetry={() => void refetch()} /></Panel>;

  if (data.accounts.length === 0) {
    return (
      <Panel title="Total assets">
        <EmptyBlock
          title="No open accounts"
          description="Once an account is opened it will appear here with its balance."
        />
      </Panel>
    );
  }

  const handleSelect = (account: Account): void => {
    events.emit('account:selected', {
      accountId: account.id,
      accountNumber: account.accountNumber,
      currency: account.currency,
    });
  };

  return (
    <Panel title="Total assets" hint={`${data.accountCount} accounts`}>
      <div className={styles.total}>
        <span className={styles.totalLabel}>Across all accounts</span>
        <span className={styles.totalValue}>
          {formatMoney(data.totalBalanceMinor, data.currency)}
        </span>
      </div>

      <ul className={styles.list}>
        {data.accounts.map((account) => (
          <li key={account.id}>
            <button type="button" className={styles.account} onClick={() => handleSelect(account)}>
              <span className={styles.identity}>
                <span className={styles.nickname}>{account.nickname}</span>
                <span className={styles.number}>{account.accountNumber}</span>
              </span>
              <span className={styles.amount}>
                {account.status !== 'ACTIVE' ? (
                  <span className={styles.frozen}>{account.status}</span>
                ) : null}{' '}
                {formatMoney(account.balanceMinor, account.currency)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
