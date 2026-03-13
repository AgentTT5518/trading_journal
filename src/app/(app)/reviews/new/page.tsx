import { PageHeader } from '@/shared/components/page-header';
import { ReviewForm } from '@/features/reviews/components/review-form';
import { getTradesByDateRange } from '@/features/reviews/services/queries';

export default function NewReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Review" description="Create a trading review" />
      <ReviewForm fetchTradesAction={getTradesByDateRange} />
    </div>
  );
}
