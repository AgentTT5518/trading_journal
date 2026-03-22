import { getTrades } from '@/features/trades/services/queries';
import { getSettings } from '@/features/settings/services/queries';
import { getTags, getAllTradeTagMap } from '@/features/playbooks/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { LinkButton } from '@/shared/components/link-button';
import { FilterableTradeList } from '@/features/trades/components/filterable-trade-list';
import type { TradeWithCalculations } from '@/features/trades/types';

export const dynamic = 'force-dynamic';

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

  const [allTrades, settings, allTags, tradeTagMapRaw] = await Promise.all([
    getTrades(),
    getSettings(),
    getTags(),
    getAllTradeTagMap(),
  ]);

  // Convert Map to plain object for client component serialization
  const tradeTagMap: Record<string, string[]> = {};
  for (const [tradeId, tagIds] of tradeTagMapRaw) {
    tradeTagMap[tradeId] = tagIds;
  }

  // Only include tags that are actually linked to at least one trade
  const usedTagIds = new Set(Object.values(tradeTagMap).flat());
  const tags = allTags
    .filter((t) => usedTagIds.has(t.id))
    .map((t) => ({ id: t.id, name: t.name, category: t.category }));

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
          tags={tags}
          tradeTagMap={tradeTagMap}
        />
      )}
    </div>
  );
}
