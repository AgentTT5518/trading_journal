'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createTrade } from '../services/actions';
import type { ActionState } from '../types';

const initialState: ActionState<{ id: string }> = { success: false };

export function TradeForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createTrade, initialState);

  useEffect(() => {
    if (state.success && state.data) {
      toast.success('Trade logged successfully');
      router.push(`/trades/${state.data.id}`);
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trade Info */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="hidden" name="assetClass" value="stock" />

            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker</Label>
              <Input
                id="ticker"
                name="ticker"
                placeholder="AAPL"
                className="uppercase"
              />
              {state.errors?.ticker && (
                <p className="text-sm text-destructive">{state.errors.ticker[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select name="direction" defaultValue="long">
                <SelectTrigger id="direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type</Label>
              <Select name="orderType" defaultValue="limit">
                <SelectTrigger id="orderType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop_limit">Stop Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryTrigger">Entry Trigger / Reason</Label>
              <Textarea
                id="entryTrigger"
                name="entryTrigger"
                placeholder="Why did you enter this trade?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Entry Date & Time</Label>
              <Input id="entryDate" name="entryDate" type="datetime-local" />
              {state.errors?.entryDate && (
                <p className="text-sm text-destructive">{state.errors.entryDate[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                name="entryPrice"
                type="number"
                step="0.0001"
                placeholder="0.00"
              />
              {state.errors?.entryPrice && (
                <p className="text-sm text-destructive">
                  {state.errors.entryPrice[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="positionSize">Position Size (shares)</Label>
              <Input
                id="positionSize"
                name="positionSize"
                type="number"
                step="1"
                placeholder="100"
              />
              {state.errors?.positionSize && (
                <p className="text-sm text-destructive">
                  {state.errors.positionSize[0]}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exit */}
        <Card>
          <CardHeader>
            <CardTitle>Exit (optional for open trades)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exitDate">Exit Date & Time</Label>
              <Input id="exitDate" name="exitDate" type="datetime-local" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input
                id="exitPrice"
                name="exitPrice"
                type="number"
                step="0.0001"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitReason">Exit Reason</Label>
              <Select name="exitReason">
                <SelectTrigger id="exitReason">
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
          </CardContent>
        </Card>

        {/* Fees & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Fees & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissions">Commissions</Label>
                <Input
                  id="commissions"
                  name="commissions"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fees">Fees</Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes about this trade..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Trade'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/trades')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
