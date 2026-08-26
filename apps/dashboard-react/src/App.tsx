import { ShieldAlert } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="dash:mx-auto dash:max-w-xl">
        <CardContent className="dash:flex dash:flex-col dash:items-center dash:gap-2 dash:py-10 dash:text-center">
          <ShieldAlert className="dash:text-muted-foreground dash:size-6" aria-hidden="true" />
          <p role="status" className="dash:font-semibold">
            Dashboard unavailable
          </p>
          <p className="dash:text-muted-foreground dash:text-sm">
            Your role does not include access to the financial overview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="dash:grid dash:items-start dash:gap-4 dash:lg:grid-cols-3">
      <div className="dash:lg:col-span-2">
        <SpendingOverview />
      </div>
      <BalanceSummary />
      <div className="dash:lg:col-span-3">
        <RecentTransactions />
      </div>
    </div>
  );
}
