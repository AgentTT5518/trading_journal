import { notFound } from 'next/navigation';
import { getJournalEntryById } from '@/features/journal/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { JournalDetail } from '@/features/journal/components/journal-detail';

const categoryLabels: Record<string, string> = {
  pre_market: 'Pre-Market',
  post_market: 'Post-Market',
  intraday: 'Intraday',
  general: 'General',
  lesson: 'Lesson',
};

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getJournalEntryById(id);

  if (!entry) notFound();

  const title = entry.title ?? categoryLabels[entry.category] ?? entry.category;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={entry.date} />
      <JournalDetail entry={entry} />
    </div>
  );
}
