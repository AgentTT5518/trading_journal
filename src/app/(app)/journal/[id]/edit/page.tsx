import { notFound } from 'next/navigation';
import { getJournalEntryById } from '@/features/journal/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { JournalEditForm } from '@/features/journal/components/journal-edit-form';

export const dynamic = 'force-dynamic';

export default async function JournalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getJournalEntryById(id);

  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Journal Entry" description={entry.date} />
      <JournalEditForm entry={entry} />
    </div>
  );
}
