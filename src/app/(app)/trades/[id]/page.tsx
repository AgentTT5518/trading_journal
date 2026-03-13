import { notFound } from 'next/navigation';
import { getTradeById } from '@/features/trades/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { TradeDetail } from '@/features/trades/components/trade-detail';
import { LinkButton } from '@/shared/components/link-button';
import { getTradeTagsForTrade } from '@/features/playbooks/services/queries';

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trade, tradeTags] = await Promise.all([
    getTradeById(id),
    getTradeTagsForTrade(id),
  ]);

  if (!trade) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${trade.ticker} — ${trade.direction.toUpperCase()}`}
        description={`${trade.assetClass.charAt(0).toUpperCase() + trade.assetClass.slice(1)} trade`}
        action={
          <LinkButton href="/trades" variant="outline">
            Back to Trades
          </LinkButton>
        }
      />
      <TradeDetail trade={trade} tradeTags={tradeTags} />
    </div>
  );
}
