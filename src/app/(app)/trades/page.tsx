import { getTrades } from '@/features/trades/services/queries';
import { getSettings } from '@/features/settings/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { LinkButton } from '@/shared/components/link-button';
import { TradeList } from '@/features/trades/components/trade-list';

export default async function TradesPage() {
  const [trades, settings] = await Promise.all([getTrades(), getSettings()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trades"
        description="Log and review your trading activity"
        action={<LinkButton href="/trades/new">New Trade</LinkButton>}
      />
      {trades.length === 0 ? (
        <EmptyState
          title="No trades yet"
          description="Log your first trade to start tracking your performance"
          action={
            <LinkButton href="/trades/new">Log your first trade</LinkButton>
          }
        />
      ) : (
        <TradeList trades={trades} dateFormat={settings.dateFormat} />
      )}
    </div>
  );
}
