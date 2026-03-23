import { PageHeader } from '@/shared/components/page-header';
import { TradeForm } from '@/features/trades/components/trade-form';
import { getTags, getPlaybooks } from '@/features/playbooks/services/queries';
import { seedPredefinedTags } from '@/features/playbooks/services/seed-tags';
import { getRulesForPlaybook } from '@/features/rule-adherence/services/queries';
import type { PlaybookRule } from '@/features/rule-adherence/types';

export const dynamic = 'force-dynamic';

export default async function NewTradePage() {
  await seedPredefinedTags();
  const [tags, playbooks] = await Promise.all([getTags(), getPlaybooks()]);

  // Fetch rules for all playbooks in parallel
  const rulesArrays = await Promise.all(
    playbooks.map((pb) => getRulesForPlaybook(pb.id))
  );
  const rulesByPlaybook: Record<string, PlaybookRule[]> = {};
  playbooks.forEach((pb, i) => {
    if (rulesArrays[i].length > 0) rulesByPlaybook[pb.id] = rulesArrays[i];
  });

  return (
    <div className="space-y-6">
      <PageHeader title="New Trade" description="Log a new trade entry" />
      <TradeForm tags={tags} rulesByPlaybook={rulesByPlaybook} />
    </div>
  );
}
