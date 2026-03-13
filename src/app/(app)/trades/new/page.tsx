import { PageHeader } from '@/shared/components/page-header';
import { TradeForm } from '@/features/trades/components/trade-form';

export default function NewTradePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Trade" description="Log a new trade entry" />
      <TradeForm />
    </div>
  );
}
