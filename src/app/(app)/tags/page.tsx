import { PageHeader } from '@/shared/components/page-header';
import { TagManager } from '@/features/playbooks/components/tag-manager';
import { getTagsWithTradeCount } from '@/features/playbooks/services/queries';
import { seedPredefinedTags } from '@/features/playbooks/services/seed-tags';

export default async function TagsPage() {
  // Auto-seed on first visit (idempotent)
  await seedPredefinedTags();

  const tags = await getTagsWithTradeCount();

  return (
    <div className="space-y-6">
      <PageHeader title="Tags" description="Manage trade tags and categories" />
      <TagManager tags={tags} />
    </div>
  );
}
