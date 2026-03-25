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
import { Textarea } from '@/components/ui/textarea';
import { addExitLeg, updateExitLeg } from '../services/actions';
import type { ActionState, ExitLeg } from '../types';

const initialState: ActionState<{ id: string }> = { success: false };

interface ExitLegFormProps {
  tradeId: string;
  remainingQty: number;
  /** Provide when editing an existing leg */
  existingLeg?: ExitLeg;
  onDone?: () => void;
}

export function ExitLegForm({ tradeId, remainingQty, existingLeg, onDone }: ExitLegFormProps) {
  const action = existingLeg
    ? updateExitLeg.bind(null, existingLeg.id, tradeId)
    : addExitLeg.bind(null, tradeId);

  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(existingLeg ? 'Exit leg updated' : 'Exit leg added');
      onDone?.();
    } else if (state.message && !state.success && state.message !== '') {
      toast.error(state.message);
    }
  }, [state, existingLeg, onDone]);

  function toDatetimeLocal(value: string | null | undefined) {
    if (!value) return '';
    return value.slice(0, 16);
  }

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="el-exitDate">Exit Date & Time</Label>
          <Input
            id="el-exitDate"
            name="exitDate"
            type="datetime-local"
            defaultValue={toDatetimeLocal(existingLeg?.exitDate)}
          />
          {state.errors?.exitDate && (
            <p className="text-sm text-destructive">{state.errors.exitDate[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="el-exitPrice">Exit Price</Label>
          <Input
            id="el-exitPrice"
            name="exitPrice"
            type="number"
            step="0.0001"
            placeholder="0.00"
            defaultValue={existingLeg?.exitPrice ?? ''}
          />
          {state.errors?.exitPrice && (
            <p className="text-sm text-destructive">{state.errors.exitPrice[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="el-quantity">
            Quantity{' '}
            <span className="font-normal text-muted-foreground">
              (max {existingLeg ? existingLeg.quantity + remainingQty : remainingQty})
            </span>
          </Label>
          <Input
            id="el-quantity"
            name="quantity"
            type="number"
            step="1"
            placeholder="50"
            defaultValue={existingLeg?.quantity ?? ''}
          />
          {state.errors?.quantity && (
            <p className="text-sm text-destructive">{state.errors.quantity[0]}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="el-exitReason">Exit Reason</Label>
          <Select key={`exitReason-${existingLeg?.exitReason}`} name="exitReason" defaultValue={existingLeg?.exitReason ?? undefined}>
            <SelectTrigger id="el-exitReason">
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="target_hit">Target Hit</SelectItem>
              <SelectItem value="stop_hit">Stop Hit</SelectItem>
              <SelectItem value="trailing_stop">Trailing Stop</SelectItem>
              <SelectItem value="time_based">Time Based</SelectItem>
              <SelectItem value="discretionary">Discretionary</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="el-fees">Fees</Label>
          <Input
            id="el-fees"
            name="fees"
            type="number"
            step="0.01"
            defaultValue={existingLeg?.fees ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="el-notes">Notes</Label>
        <Textarea
          id="el-notes"
          name="notes"
          rows={2}
          defaultValue={existingLeg?.notes ?? ''}
          placeholder="Optional notes for this exit leg"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Saving...' : existingLeg ? 'Update Leg' : 'Add Leg'}
        </Button>
        {onDone && (
          <Button type="button" size="sm" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
