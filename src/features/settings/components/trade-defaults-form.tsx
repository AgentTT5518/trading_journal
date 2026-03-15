'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateSettings } from '../services/actions';
import type { Settings, ActionState } from '../types';

interface TradeDefaultsFormProps {
  settings: Settings;
}

export function TradeDefaultsForm({ settings }: TradeDefaultsFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateSettings,
    { success: false }
  );

  useEffect(() => {
    if (state.success) toast.success(state.message ?? 'Settings saved');
    else if (!state.success && state.message && state.message !== '') toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      {/* Pass other sections through as hidden */}
      <input type="hidden" name="traderName" value={settings.traderName} />
      <input type="hidden" name="timezone" value={settings.timezone} />
      <input type="hidden" name="currency" value={settings.currency} />
      {settings.startingCapital != null && (
        <input type="hidden" name="startingCapital" value={settings.startingCapital} />
      )}
      <input type="hidden" name="dateFormat" value={settings.dateFormat} />
      <input type="hidden" name="theme" value={settings.theme} />
      <Card>
        <CardHeader>
          <CardTitle>Trade Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.message && !state.success && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="defaultCommission">Default Commission ($)</Label>
              <Input
                id="defaultCommission"
                name="defaultCommission"
                type="number"
                min="0"
                step="0.01"
                defaultValue={settings.defaultCommission}
              />
              {state.errors?.defaultCommission && (
                <p className="mt-1 text-xs text-destructive">{state.errors.defaultCommission[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="defaultRiskPercent">Default Risk % per Trade</Label>
              <Input
                id="defaultRiskPercent"
                name="defaultRiskPercent"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                defaultValue={settings.defaultRiskPercent}
              />
              {state.errors?.defaultRiskPercent && (
                <p className="mt-1 text-xs text-destructive">{state.errors.defaultRiskPercent[0]}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="positionSizingMethod">Position Sizing Method</Label>
            <Select name="positionSizingMethod" defaultValue={settings.positionSizingMethod}>
              <SelectTrigger id="positionSizingMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed-dollar">Fixed Dollar</SelectItem>
                <SelectItem value="percent-equity">% of Equity</SelectItem>
                <SelectItem value="kelly">Kelly Criterion</SelectItem>
              </SelectContent>
            </Select>
            {state.errors?.positionSizingMethod && (
              <p className="mt-1 text-xs text-destructive">
                {state.errors.positionSizingMethod[0]}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Trade Defaults'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
