import { AlertTriangle } from 'lucide-react';
import type { GoalWithProgress } from '../types';

type GoalAlertProps = {
  goal: GoalWithProgress;
};

export function GoalAlert({ goal }: GoalAlertProps) {
  if (goal.goalType === 'max_loss') {
    if (goal.isExceeded) {
      return (
        <div className="flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Max loss limit exceeded</span>
        </div>
      );
    }
    if (goal.progressPercent >= 80) {
      return (
        <div className="flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Approaching max loss limit ({Math.round(goal.progressPercent)}%)</span>
        </div>
      );
    }
    return null;
  }

  // For other goal types: alert when behind pace
  if (!goal.isOnTrack && goal.pacePercent > 10) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Behind pace ({Math.round(goal.progressPercent)}% vs {Math.round(goal.pacePercent)}% expected)</span>
      </div>
    );
  }

  return null;
}
