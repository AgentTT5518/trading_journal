import { notFound, redirect } from 'next/navigation';
import { getReviewById } from '@/features/reviews/services/queries';
import { deleteReview } from '@/features/reviews/services/actions';
import { PageHeader } from '@/shared/components/page-header';
import { LinkButton } from '@/shared/components/link-button';
import { Button } from '@/components/ui/button';
import { ReviewDetail } from '@/features/reviews/components/review-detail';

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReviewById(id);

  if (!review) notFound();

  async function handleDelete() {
    'use server';
    await deleteReview(id);
    redirect('/reviews');
  }

  const title = `${review.type.charAt(0).toUpperCase() + review.type.slice(1)} Review`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/reviews/${id}/edit`} variant="outline">
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
      <ReviewDetail review={review} />
    </div>
  );
}
