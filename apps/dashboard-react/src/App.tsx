import styles from './App.module.css';
import { usePlatformEvents } from './events/use-platform-events';
import { BalanceSummary } from './features/balance/BalanceSummary';
import { RecentTransactions } from './features/transactions/RecentTransactions';
import { SpendingOverview } from './features/spending/SpendingOverview';
import { useShell } from './shell/shell-context';

/**
 * The Dashboard domain's root. It owns its own layout and nothing outside it:
 * the shell gives this component a DOM node and the platform capabilities, and
 * has no opinion about what appears inside.
 */
export function App() {
  const { auth } = useShell();
  usePlatformEvents();

  // A second line of defence, not the control. The API rejects these calls for
  // a user without the permission regardless of what this component renders.
  if (!auth.hasPermission('VIEW_DASHBOARD')) {
    return (
      <div className={styles.denied} role="status">
        <p className={styles.deniedTitle}>Dashboard unavailable</p>
        <p>Your role does not include access to the financial overview.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      <BalanceSummary />
      <div className={styles.wide}>
        <SpendingOverview />
      </div>
      <RecentTransactions />
    </div>
  );
}
