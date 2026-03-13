'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RulesListInput } from './rules-list-input';
import { createReview } from '../services/actions';
import { formatCurrency } from '@/shared/utils/formatting';
import type { ActionState } from '@/features/trades/types';

interface TradeSummary {
  id: string;
  ticker: string;
  direction: string;
  entryDate: string;
  netPnl: number;
}

interface ReviewFormProps {
  fetchTradesAction: (startDate: string, endDate: string) => Promise<TradeSummary[]>;
}

function getDefaultDates(type: string): { startDate: string; endDate: string } {
  const today = new Date();
  const yyyy = (d: Date) => d.toISOString().split('T')[0];

  if (type === 'daily') {
    const d = yyyy(today);
    return { startDate: d, endDate: d };
  }

  if (type === 'weekly') {
    // Previous Mon-Fri
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1; // days since Monday
    const mon = new Date(today);
    mon.setDate(today.getDate() - diff - 7);
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);
    return { startDate: yyyy(mon), endDate: yyyy(fri) };
  }

  // monthly: previous month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  return { startDate: yyyy(firstOfMonth), endDate: yyyy(lastOfMonth) };
}

export function ReviewForm({ fetchTradesAction }: ReviewFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState<{ id: string }>, FormData>(
    createReview,
    { success: false, message: '' }
  );

  const [reviewType, setReviewType] = useState('weekly');
  const [startDate, setStartDate] = useState(() => getDefaultDates('weekly').startDate);
  const [endDate, setEndDate] = useState(() => getDefaultDates('weekly').endDate);
  const [trades, setTrades] = useState<TradeSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.success && state.data?.id) {
      toast.success('Review created');
      router.push(`/reviews/${state.data.id}`);
    }
  }, [state, router]);

  function handleTypeChange(type: string | null) {
    if (!type) return;
    setReviewType(type);
    const defaults = getDefaultDates(type);
    setStartDate(defaults.startDate);
    setEndDate(defaults.endDate);
  }

  async function handleFetchTrades() {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const result = await fetchTradesAction(startDate, endDate);
      setTrades(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.success && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Review Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select name="type" value={reviewType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="button" variant="outline" onClick={handleFetchTrades} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Trades in Range'}
          </Button>

          {trades.length > 0 && (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Ticker</th>
                    <th className="px-3 py-2 text-left font-medium">Dir</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="px-3 py-2">{t.ticker}</td>
                      <td className="px-3 py-2 uppercase">{t.direction}</td>
                      <td className="px-3 py-2">{t.entryDate}</td>
                      <td className={`px-3 py-2 text-right ${t.netPnl > 0 ? 'text-green-600' : t.netPnl < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(t.netPnl)}
                      </td>
                      <input type="hidden" name="tradeIds" value={t.id} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {trades.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">No trades loaded. Click &quot;Fetch Trades&quot; to populate.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select name="grade">
              <SelectTrigger>
                <SelectValue placeholder="Select grade..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A — Excellent</SelectItem>
                <SelectItem value="B">B — Good</SelectItem>
                <SelectItem value="C">C — Average</SelectItem>
                <SelectItem value="D">D — Below Average</SelectItem>
                <SelectItem value="F">F — Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={4} placeholder="General observations..." />
          </div>

          <div>
            <Label htmlFor="lessonsLearned">Lessons Learned</Label>
            <Textarea id="lessonsLearned" name="lessonsLearned" rows={3} placeholder="What did you learn?" />
          </div>

          <div>
            <Label htmlFor="goalsForNext">Goals for Next Period</Label>
            <Textarea id="goalsForNext" name="goalsForNext" rows={3} placeholder="What will you focus on?" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Rules Followed</Label>
            <RulesListInput name="rulesFollowed" label="rule followed" />
          </div>
          <div>
            <Label>Rules Broken</Label>
            <RulesListInput name="rulesBroken" label="rule broken" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Review'}
        </Button>
      </div>
    </form>
  );
}
