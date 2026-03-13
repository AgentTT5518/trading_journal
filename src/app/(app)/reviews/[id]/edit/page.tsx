import { notFound } from 'next/navigation';
import { getReviewById } from '@/features/reviews/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { ReviewEditForm } from '@/features/reviews/components/review-edit-form';

export default async function ReviewEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReviewById(id);

  if (!review) notFound();

  const title = `Edit ${review.type.charAt(0).toUpperCase() + review.type.slice(1)} Review`;

  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <ReviewEditForm review={review} />
    </div>
  );
}
