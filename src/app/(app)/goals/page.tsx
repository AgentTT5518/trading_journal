import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { getGoalsWithProgress } from '@/features/goals/services/queries';
import { GoalsDashboard } from '@/features/goals/components/goals-dashboard';
import { GoalDialog } from '@/features/goals/components/goal-dialog';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const goals = await getGoalsWithProgress();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Track your trading targets and limits"
        action={<GoalDialog mode="create" />}
      />

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set P&L targets, loss limits, or trade count goals to track your progress."
          action={<GoalDialog mode="create" />}
        />
      ) : (
        <GoalsDashboard goals={goals} />
      )}
    </div>
  );
}
