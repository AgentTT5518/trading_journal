'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createGoal, updateGoal } from '../services/actions';
import type { Goal, GoalActionState } from '../types';

type GoalFormProps = {
  goal?: Goal;
  onSuccess?: () => void;
};

export function GoalForm({ goal, onSuccess }: GoalFormProps) {
  const isEdit = !!goal;
  const action = isEdit ? updateGoal : createGoal;

  const [state, formAction, isPending] = useActionState<GoalActionState, FormData>(
    action,
    { success: false, message: '' }
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={goal.id} />}

      {state.message && !state.success && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={goal?.name ?? ''}
          placeholder="e.g., March P&L Target"
          required
        />
        {state.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="goalType">Type *</Label>
          <Select name="goalType" defaultValue={goal?.goalType ?? 'monthly_pnl'}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly_pnl">P&L Target</SelectItem>
              <SelectItem value="max_loss">Max Loss Limit</SelectItem>
              <SelectItem value="trade_count">Trade Count</SelectItem>
              <SelectItem value="win_rate">Win Rate (%)</SelectItem>
            </SelectContent>
          </Select>
          {state.errors?.goalType && (
            <p className="text-xs text-destructive">{state.errors.goalType[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="period">Period *</Label>
          <Select name="period" defaultValue={goal?.period ?? 'monthly'}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
          {state.errors?.period && (
            <p className="text-xs text-destructive">{state.errors.period[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetValue">Target Value *</Label>
        <Input
          id="targetValue"
          name="targetValue"
          type="number"
          step="any"
          min="0"
          defaultValue={goal?.targetValue ?? ''}
          placeholder="e.g., 5000"
          required
        />
        {state.errors?.targetValue && (
          <p className="text-xs text-destructive">{state.errors.targetValue[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : isEdit ? 'Update Goal' : 'Create Goal'}
      </Button>
    </form>
  );
}
