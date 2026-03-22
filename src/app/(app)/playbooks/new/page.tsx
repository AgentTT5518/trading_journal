import { getTags } from '@/features/playbooks/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { PlaybookForm } from '@/features/playbooks/components/playbook-form';

export const dynamic = 'force-dynamic';

export default async function NewPlaybookPage() {
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <PageHeader title="New Playbook" description="Define a new trading strategy" />
      <PlaybookForm tags={tags} />
    </div>
  );
}
