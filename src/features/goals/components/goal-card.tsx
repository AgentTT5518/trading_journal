'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, Trash2, Pencil } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/shared/utils/formatting';
import { GoalProgressBar } from './goal-progress-bar';
import { GoalAlert } from './goal-alert';
import { deleteGoal, toggleGoalActive } from '../services/actions';
import type { GoalWithProgress } from '../types';

const GOAL_TYPE_LABELS: Record<string, string> = {
  monthly_pnl: 'P&L Target',
  max_loss: 'Max Loss',
  trade_count: 'Trade Count',
  win_rate: 'Win Rate',
};

function formatGoalValue(goalType: string, value: number): string {
  switch (goalType) {
    case 'monthly_pnl':
    case 'max_loss':
      return formatCurrency(value);
    case 'win_rate':
      return formatPercent(value / 100);
    case 'trade_count':
      return String(Math.round(value));
    default:
      return String(value);
  }
}

type GoalCardProps = {
  goal: GoalWithProgress;
  onEdit: (goal: GoalWithProgress) => void;
};

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const isMaxLoss = goal.goalType === 'max_loss';
  const variant = isMaxLoss ? 'negative' : 'positive';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {goal.name}
            </CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {GOAL_TYPE_LABELS[goal.goalType] ?? goal.goalType}
              </Badge>
              <span className="text-xs text-muted-foreground capitalize">
                {goal.period}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(goal)}
              title="Edit goal"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <form action={async () => { await toggleGoalActive(goal.id); }}>
              <Button
                variant="ghost"
                size="icon-sm"
                type="submit"
                title={goal.isActive ? 'Pause goal' : 'Activate goal'}
              >
                {goal.isActive ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
            </form>
            <form action={async () => { await deleteGoal(goal.id); }}>
              <Button
                variant="ghost"
                size="icon-sm"
                type="submit"
                title="Delete goal"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between font-mono text-sm">
          <span className="font-semibold">
            {formatGoalValue(goal.goalType, goal.currentValue)}
          </span>
          <span className="text-muted-foreground">
            / {formatGoalValue(goal.goalType, goal.targetValue)}
          </span>
        </div>

        <GoalProgressBar
          value={goal.currentValue}
          max={goal.targetValue}
          variant={variant}
        />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{Math.round(goal.progressPercent)}% complete</span>
          {goal.goalType !== 'win_rate' && (
            <span>{Math.round(goal.pacePercent)}% of period elapsed</span>
          )}
        </div>

        <GoalAlert goal={goal} />
      </CardContent>
    </Card>
  );
}
