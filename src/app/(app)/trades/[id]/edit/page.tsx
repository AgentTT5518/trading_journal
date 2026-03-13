import { notFound } from 'next/navigation';
import { getTradeById } from '@/features/trades/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { TradeEditForm } from '@/features/trades/components/trade-edit-form';
import { LinkButton } from '@/shared/components/link-button';

export default async function TradeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await getTradeById(id);

  if (!trade) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${trade.ticker} — ${trade.direction.toUpperCase()}`}
        description="Update trade details or close the position"
        action={
          <LinkButton href={`/trades/${id}`} variant="outline">
            Cancel
          </LinkButton>
        }
      />
      <TradeEditForm trade={trade} />
    </div>
  );
}
