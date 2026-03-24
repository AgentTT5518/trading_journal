'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalCard } from './goal-card';
import { GoalDialog } from './goal-dialog';
import type { GoalWithProgress } from '../types';

type GoalsDashboardProps = {
  goals: GoalWithProgress[];
};

export function GoalsDashboard({ goals }: GoalsDashboardProps) {
  const [editGoal, setEditGoal] = useState<GoalWithProgress | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const activeGoals = goals.filter((g) => g.isActive);
  const inactiveGoals = goals.filter((g) => !g.isActive);

  return (
    <div className="space-y-6">
      {/* Active Goals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onEdit={setEditGoal} />
        ))}
      </div>

      {activeGoals.length === 0 && (
        <p className="text-sm text-muted-foreground">No active goals. Create one to get started.</p>
      )}

      {/* Inactive Goals */}
      {inactiveGoals.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className="text-muted-foreground"
          >
            {showInactive ? (
              <ChevronDown className="mr-1 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-1 h-4 w-4" />
            )}
            {inactiveGoals.length} paused goal{inactiveGoals.length !== 1 ? 's' : ''}
          </Button>
          {showInactive && (
            <div className="mt-3 grid gap-4 opacity-60 sm:grid-cols-2 lg:grid-cols-3">
              {inactiveGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onEdit={setEditGoal} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <GoalDialog
        mode="edit"
        goal={editGoal ?? undefined}
        open={!!editGoal}
        onOpenChange={(open) => !open && setEditGoal(null)}
      />
    </div>
  );
}
