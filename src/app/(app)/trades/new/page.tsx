import { PageHeader } from '@/shared/components/page-header';
import { TradeForm } from '@/features/trades/components/trade-form';
import { getTags } from '@/features/playbooks/services/queries';
import { seedPredefinedTags } from '@/features/playbooks/services/seed-tags';

export const dynamic = 'force-dynamic';

export default async function NewTradePage() {
  await seedPredefinedTags();
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <PageHeader title="New Trade" description="Log a new trade entry" />
      <TradeForm tags={tags} />
    </div>
  );
}
