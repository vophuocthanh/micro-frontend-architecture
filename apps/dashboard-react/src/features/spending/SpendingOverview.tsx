import { Progress } from '@/components/ui/progress';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../../components/StatusBlock';
import { Panel } from '../../components/Panel';
import { useSpendingOverview } from '../../hooks/use-dashboard-queries';
import { formatMoney, formatPercent, humanise } from '../../utils/format';
import { MonthlyChart } from './MonthlyChart';

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
      <div className="dash:mb-4 dash:grid dash:grid-cols-2 dash:gap-3">
        <div className="dash:bg-muted/50 dash:rounded-lg dash:p-3">
          <p className="dash:text-muted-foreground dash:text-xs">Total spending</p>
          <p className="dash:mt-0.5 dash:text-lg dash:font-semibold dash:tabular-nums">
            {formatMoney(data.totalSpendingMinor, data.currency)}
          </p>
        </div>
        <div className="dash:bg-muted/50 dash:rounded-lg dash:p-3">
          <p className="dash:text-muted-foreground dash:text-xs">Total income</p>
          <p className="dash:mt-0.5 dash:text-lg dash:font-semibold dash:tabular-nums">
            {formatMoney(data.totalIncomeMinor, data.currency)}
          </p>
        </div>
      </div>

      <MonthlyChart points={data.monthly} currency={data.currency} />

      <ul className="dash:mt-5 dash:space-y-3">
        {data.byCategory.slice(0, TOP_CATEGORIES).map((category) => (
          <li key={category.category} className="dash:space-y-1.5">
            <div className="dash:flex dash:items-baseline dash:justify-between dash:gap-3 dash:text-sm">
              <span>
                {humanise(category.category)}{' '}
                <span className="dash:text-muted-foreground dash:text-xs">
                  {formatPercent(category.share)}
                </span>
              </span>
              <span className="dash:font-medium dash:tabular-nums">
                {formatMoney(category.amountMinor, data.currency)}
              </span>
            </div>
            <Progress value={Math.max(2, category.share * 100)} className="dash:h-1.5" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
