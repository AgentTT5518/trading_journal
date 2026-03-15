import { PageHeader } from '@/shared/components/page-header';
import { JournalForm } from '@/features/journal/components/journal-form';
import { getTradesForDate } from '@/features/journal/services/queries';

export default function NewJournalEntryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Journal Entry" description="Record your thoughts and observations" />
      <JournalForm fetchTradesAction={getTradesForDate} />
    </div>
  );
}
