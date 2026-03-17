import { getTrades } from '@/features/trades/services/queries';
import { getSettings } from '@/features/settings/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { LinkButton } from '@/shared/components/link-button';
import { FilterableTradeList } from '@/features/trades/components/filterable-trade-list';
import type { TradeWithCalculations } from '@/features/trades/types';

type TradesPageProps = {
  searchParams: Promise<{ date?: string }>;
};

/**
 * Returns trades that closed on the given YYYY-MM-DD date.
 * For exit-leg trades: any leg closing on that date counts.
 * For single-exit trades: exitDate prefix match.
 */
function filterByExitDate(
  trades: TradeWithCalculations[],
  date: string,
): TradeWithCalculations[] {
  return trades.filter((t) => {
    if (t.exitLegs.length > 0) {
      return t.exitLegs.some((leg) => leg.exitDate.slice(0, 10) === date);
    }
    return t.exitDate?.slice(0, 10) === date;
  });
}

export default async function TradesPage({ searchParams }: TradesPageProps) {
  const params = await searchParams;
  const dateFilter = params.date ?? null;

  const [allTrades, settings] = await Promise.all([getTrades(), getSettings()]);

  const trades = dateFilter ? filterByExitDate(allTrades, dateFilter) : allTrades;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trades"
        description="Log and review your trading activity"
        action={<LinkButton href="/trades/new">New Trade</LinkButton>}
      />
      {allTrades.length === 0 ? (
        <EmptyState
          title="No trades yet"
          description="Log your first trade to start tracking your performance"
          action={
            <LinkButton href="/trades/new">Log your first trade</LinkButton>
          }
        />
      ) : (
        <FilterableTradeList
          trades={trades}
          dateFormat={settings.dateFormat}
          dateFilter={dateFilter}
        />
      )}
    </div>
  );
}
