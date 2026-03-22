import { getPlaybooksWithMetrics } from '@/features/playbooks/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { LinkButton } from '@/shared/components/link-button';
import { PlaybookList } from '@/features/playbooks/components/playbook-list';

export const dynamic = 'force-dynamic';

export default async function PlaybooksPage() {
  const playbooks = await getPlaybooksWithMetrics();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playbooks"
        description="Define and track your trading strategies"
        action={<LinkButton href="/playbooks/new">New Playbook</LinkButton>}
      />
      {playbooks.length === 0 ? (
        <EmptyState
          title="No playbooks yet"
          description="Create a playbook to define your trading strategies and track their performance"
          action={<LinkButton href="/playbooks/new">Create your first playbook</LinkButton>}
        />
      ) : (
        <PlaybookList playbooks={playbooks} />
      )}
    </div>
  );
}
