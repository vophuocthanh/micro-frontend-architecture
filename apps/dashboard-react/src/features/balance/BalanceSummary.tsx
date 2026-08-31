import type { Account } from '@banking/contracts';
import { ChevronRight, CreditCard, PiggyBank, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StatusBlock';
import { Panel } from '../../components/Panel';
import { useAccountSummary } from '../../hooks/use-dashboard-queries';
import { useShell } from '../../shell/shell-context';
import { formatMoney } from '../../utils/format';

const ACCOUNT_ICON: Record<Account['type'], LucideIcon> = {
  CHECKING: Wallet,
  SAVINGS: PiggyBank,
  CREDIT: CreditCard,
};

/**
 * Total assets plus a per-account breakdown.
 *
 * Selecting an account does two things that look like one. It publishes
 * `account:selected` — addressed to the platform, so Transfer can pre-fill its
 * source without this file knowing Transfer exists — and it hands the user off
 * to whichever application owns accounts, named by id rather than by URL.
 *
 * The event is retained by the bus, which is what makes the hand-off survive
 * the boundary: this application is unmounted before the next one subscribes.
 */
export function BalanceSummary() {
  const { events, navigateToApp } = useShell();
  const { data, isPending, isError, error, refetch } = useAccountSummary();

  if (isPending) {
    return (
      <Panel title="Total assets">
        <LoadingBlock label="Loading balances" rows={4} />
      </Panel>
    );
  }

  if (isError) {
    return (
      <Panel title="Total assets">
        <ErrorBlock error={error} onRetry={() => void refetch()} />
      </Panel>
    );
  }

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
    navigateToApp('account', `/${account.id}`);
  };

  return (
    <Panel title="Total assets" hint={`${data.accountCount} accounts`}>
      <p className="dash:text-muted-foreground dash:text-xs">Across all accounts</p>
      <p className="dash:mt-1 dash:text-3xl dash:font-semibold dash:tracking-tight dash:tabular-nums">
        {formatMoney(data.totalBalanceMinor, data.currency)}
      </p>

      <Separator className="dash:my-4" />

      <ul className="dash:space-y-1">
        {data.accounts.map((account) => {
          const Icon = ACCOUNT_ICON[account.type];

          return (
            <li key={account.id}>
              <button
                type="button"
                onClick={() => handleSelect(account)}
                className="dash:hover:bg-accent dash:focus-visible:ring-ring dash:flex dash:w-full dash:items-center dash:gap-3 dash:rounded-md dash:px-2 dash:py-2 dash:text-left dash:transition-colors dash:focus-visible:ring-2 dash:focus-visible:outline-none"
              >
                <span className="dash:bg-muted dash:text-muted-foreground dash:grid dash:size-8 dash:shrink-0 dash:place-items-center dash:rounded-md">
                  <Icon className="dash:size-4" aria-hidden="true" />
                </span>

                <span className="dash:min-w-0 dash:flex-1">
                  <span className="dash:block dash:truncate dash:text-sm dash:font-medium">
                    {account.nickname}
                  </span>
                  <span className="dash:text-muted-foreground dash:block dash:text-xs dash:tabular-nums">
                    {account.accountNumber}
                  </span>
                </span>

                <span className="dash:flex dash:shrink-0 dash:items-center dash:gap-2">
                  {account.status !== 'ACTIVE' && (
                    <Badge variant="outline" className="dash:text-[10px]">
                      {account.status}
                    </Badge>
                  )}
                  <span className="dash:text-sm dash:font-medium dash:tabular-nums">
                    {formatMoney(account.balanceMinor, account.currency)}
                  </span>
                  <ChevronRight
                    className="dash:text-muted-foreground dash:size-4"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
