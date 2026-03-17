'use client';

import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/components/ui/button';

type AnalyticsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AnalyticsError({ reset }: AnalyticsErrorProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Something went wrong loading analytics"
      />
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load analytics data. Please try again.
        </p>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </div>
    </div>
  );
}
