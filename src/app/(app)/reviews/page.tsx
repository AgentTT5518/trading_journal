import { getReviews } from '@/features/reviews/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { LinkButton } from '@/shared/components/link-button';
import { ReviewList } from '@/features/reviews/components/review-list';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Reflect on your trading performance"
        action={<LinkButton href="/reviews/new">New Review</LinkButton>}
      />
      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Create a review to reflect on your trading performance"
          action={<LinkButton href="/reviews/new">Create your first review</LinkButton>}
        />
      ) : (
        <ReviewList reviews={reviews} />
      )}
    </div>
  );
}
