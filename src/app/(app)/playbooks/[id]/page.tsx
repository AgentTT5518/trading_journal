import { notFound, redirect } from 'next/navigation';
import { getPlaybookById } from '@/features/playbooks/services/queries';
import { deletePlaybook } from '@/features/playbooks/services/actions';
import { getRulesForPlaybook } from '@/features/rule-adherence/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { LinkButton } from '@/shared/components/link-button';
import { Button } from '@/components/ui/button';
import { PlaybookDetail } from '@/features/playbooks/components/playbook-detail';
import { RuleManager } from '@/features/rule-adherence/components/rule-manager';

export const dynamic = 'force-dynamic';

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [playbook, rules] = await Promise.all([
    getPlaybookById(id),
    getRulesForPlaybook(id),
  ]);

  if (!playbook) notFound();

  async function handleDelete() {
    'use server';
    await deletePlaybook(id);
    redirect('/playbooks');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={playbook.name}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/playbooks/${id}/edit`} variant="outline">
              Edit
            </LinkButton>
            <form action={handleDelete}>
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </form>
          </div>
        }
      />
      <PlaybookDetail playbook={playbook} />
      <RuleManager playbookId={id} rules={rules} />
    </div>
  );
}
