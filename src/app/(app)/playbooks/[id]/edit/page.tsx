import { notFound } from 'next/navigation';
import { getPlaybookById, getTags } from '@/features/playbooks/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { PlaybookEditForm } from '@/features/playbooks/components/playbook-edit-form';

export default async function EditPlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [playbook, tags] = await Promise.all([getPlaybookById(id), getTags()]);

  if (!playbook) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Playbook" description={`Editing: ${playbook.name}`} />
      <PlaybookEditForm playbook={playbook} tags={tags} />
    </div>
  );
}
