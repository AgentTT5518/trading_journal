import { getJournalEntries } from '@/features/journal/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { LinkButton } from '@/shared/components/link-button';
import { JournalList } from '@/features/journal/components/journal-list';

export default async function JournalPage() {
  const entries = await getJournalEntries();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description="Your trading diary and daily notes"
        action={<LinkButton href="/journal/new">New Entry</LinkButton>}
      />
      {entries.length === 0 ? (
        <EmptyState
          title="No journal entries yet"
          description="Start your trading diary with a pre-market prep or post-market reflection"
          action={<LinkButton href="/journal/new">Create your first entry</LinkButton>}
        />
      ) : (
        <JournalList entries={entries} />
      )}
    </div>
  );
}
