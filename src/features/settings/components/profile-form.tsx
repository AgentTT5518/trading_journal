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

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'UTC',
];

const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'HKD'];

interface ProfileFormProps {
  settings: Settings;
}

export function ProfileForm({ settings }: ProfileFormProps) {
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
      <input type="hidden" name="timezone" value={settings.timezone} />
      <input type="hidden" name="currency" value={settings.currency} />
      <input type="hidden" name="positionSizingMethod" value={settings.positionSizingMethod} />
      <input type="hidden" name="dateFormat" value={settings.dateFormat} />
      <input type="hidden" name="theme" value={settings.theme} />
      <input type="hidden" name="defaultCommission" value={settings.defaultCommission} />
      <input type="hidden" name="defaultRiskPercent" value={settings.defaultRiskPercent} />
      <Card>
        <CardHeader>
          <CardTitle>Trader Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.message && !state.success && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          )}

          <div>
            <Label htmlFor="traderName">Trader Name</Label>
            <Input
              id="traderName"
              name="traderName"
              defaultValue={settings.traderName}
              placeholder="Your name or alias"
            />
            {state.errors?.traderName && (
              <p className="mt-1 text-xs text-destructive">{state.errors.traderName[0]}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue={settings.timezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.timezone && (
                <p className="mt-1 text-xs text-destructive">{state.errors.timezone[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Base Currency</Label>
              <Select name="currency" defaultValue={settings.currency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.currency && (
                <p className="mt-1 text-xs text-destructive">{state.errors.currency[0]}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="startingCapital">Starting Capital</Label>
            <Input
              id="startingCapital"
              name="startingCapital"
              type="number"
              min="0"
              step="0.01"
              defaultValue={settings.startingCapital ?? ''}
              placeholder="Optional — used for portfolio-level P&L %"
            />
            {state.errors?.startingCapital && (
              <p className="mt-1 text-xs text-destructive">{state.errors.startingCapital[0]}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
