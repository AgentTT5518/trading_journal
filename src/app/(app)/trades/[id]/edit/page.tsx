import { notFound } from 'next/navigation';
import { getTradeById } from '@/features/trades/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { TradeEditForm } from '@/features/trades/components/trade-edit-form';
import { LinkButton } from '@/shared/components/link-button';
import { getTags, getPlaybooks } from '@/features/playbooks/services/queries';
import { getTagIdsForTrade } from '@/features/playbooks/services/queries';
import { getRulesForPlaybook, getTradeRuleChecks } from '@/features/rule-adherence/services/queries';
import type { PlaybookRule } from '@/features/rule-adherence/types';

export const dynamic = 'force-dynamic';

export default async function TradeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trade, tags, selectedTagIds, playbooks, existingChecks] = await Promise.all([
    getTradeById(id),
    getTags(),
    getTagIdsForTrade(id),
    getPlaybooks(),
    getTradeRuleChecks(id),
  ]);

  if (!trade) {
    notFound();
  }

  // Fetch rules for all playbooks in parallel
  const rulesArrays = await Promise.all(
    playbooks.map((pb) => getRulesForPlaybook(pb.id))
  );
  const rulesByPlaybook: Record<string, PlaybookRule[]> = {};
  playbooks.forEach((pb, i) => {
    if (rulesArrays[i].length > 0) rulesByPlaybook[pb.id] = rulesArrays[i];
  });

  // Get IDs of rules that were previously checked as "followed"
  const checkedRuleIds = existingChecks
    .filter((c) => c.followed)
    .map((c) => c.ruleId);

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
      <TradeEditForm
        trade={trade}
        tags={tags}
        selectedTagIds={selectedTagIds}
        rulesByPlaybook={rulesByPlaybook}
        checkedRuleIds={checkedRuleIds}
      />
    </div>
  );
}
