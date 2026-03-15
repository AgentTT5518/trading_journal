'use client';

import { useActionState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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

const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

interface DisplayPreferencesFormProps {
  settings: Settings;
}

export function DisplayPreferencesForm({ settings }: DisplayPreferencesFormProps) {
  const { setTheme } = useTheme();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateSettings,
    { success: false }
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Settings saved');
      // Theme is read from the DOM data after the form submits;
      // we apply it client-side after confirmed save.
      const formEl = document.getElementById('display-preferences-form') as HTMLFormElement | null;
      if (formEl) {
        const themeVal = (formEl.elements.namedItem('theme') as HTMLSelectElement | null)?.value;
        if (themeVal) setTheme(themeVal);
      }
    } else if (!state.success && state.message && state.message !== '') {
      toast.error(state.message);
    }
  }, [state, setTheme]);

  return (
    <form id="display-preferences-form" action={formAction}>
      {/* Pass other sections through as hidden */}
      <input type="hidden" name="traderName" value={settings.traderName} />
      <input type="hidden" name="timezone" value={settings.timezone} />
      <input type="hidden" name="currency" value={settings.currency} />
      {settings.startingCapital != null && (
        <input type="hidden" name="startingCapital" value={settings.startingCapital} />
      )}
      <input type="hidden" name="defaultCommission" value={settings.defaultCommission} />
      <input type="hidden" name="defaultRiskPercent" value={settings.defaultRiskPercent} />
      <input type="hidden" name="positionSizingMethod" value={settings.positionSizingMethod} />
      <Card>
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.message && !state.success && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.message}
            </div>
          )}

          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select name="dateFormat" defaultValue={settings.dateFormat}>
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Note: date format is stored but not yet applied to all date displays.
            </p>
          </div>

          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select name="theme" defaultValue={settings.theme}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            {state.errors?.theme && (
              <p className="mt-1 text-xs text-destructive">{state.errors.theme[0]}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Display Preferences'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
