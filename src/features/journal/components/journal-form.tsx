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
import { createJournalEntry } from '../services/actions';
import type { ActionState } from '@/features/trades/types';

interface TradeSummary {
  id: string;
  ticker: string;
  assetClass: string;
  direction: string;
  entryDate: string;
  exitDate: string | null;
}

interface JournalFormProps {
  fetchTradesAction: (date: string) => Promise<TradeSummary[]>;
}

function todayDate() {
  return new Date().toISOString().split('T')[0];
}

export function JournalForm({ fetchTradesAction }: JournalFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ActionState<{ id: string }>, FormData>(
    createJournalEntry,
    { success: false, message: '' }
  );

  const [date, setDate] = useState(todayDate);
  const [trades, setTrades] = useState<TradeSummary[]>([]);
  const [selectedTradeIds, setSelectedTradeIds] = useState<Set<string>>(new Set());
  const [loadingTrades, setLoadingTrades] = useState(false);

  useEffect(() => {
    if (state.success && state.data?.id) {
      toast.success('Journal entry created');
      router.push(`/journal/${state.data.id}`);
    }
  }, [state, router]);

  async function handleFetchTrades() {
    if (!date) return;
    setLoadingTrades(true);
    try {
      const result = await fetchTradesAction(date);
      setTrades(result);
      setSelectedTradeIds(new Set(result.map((t) => t.id)));
    } finally {
      setLoadingTrades(false);
    }
  }

  function toggleTrade(id: string) {
    setSelectedTradeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.success && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Entry Info */}
      <Card>
        <CardHeader>
          <CardTitle>Entry Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select name="category" defaultValue="pre_market">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_market">Pre-Market</SelectItem>
                  <SelectItem value="post_market">Post-Market</SelectItem>
                  <SelectItem value="intraday">Intraday</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="lesson">Lesson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Optional short title..." />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="content">Notes *</Label>
          <Textarea
            id="content"
            name="content"
            rows={8}
            placeholder="Write your thoughts, observations, or lessons here... (markdown supported)"
            required
          />
          {state.errors?.content && (
            <p className="mt-1 text-xs text-destructive">{state.errors.content[0]}</p>
          )}
        </CardContent>
      </Card>

      {/* Psychology */}
      <Card>
        <CardHeader>
          <CardTitle>Psychology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="mood">Mood</Label>
              <Select name="mood">
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Very Low</SelectItem>
                  <SelectItem value="2">2 — Low</SelectItem>
                  <SelectItem value="3">3 — Neutral</SelectItem>
                  <SelectItem value="4">4 — Good</SelectItem>
                  <SelectItem value="5">5 — Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="energy">Energy</Label>
              <Select name="energy">
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Exhausted</SelectItem>
                  <SelectItem value="2">2 — Tired</SelectItem>
                  <SelectItem value="3">3 — Normal</SelectItem>
                  <SelectItem value="4">4 — Alert</SelectItem>
                  <SelectItem value="5">5 — Energized</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="marketSentiment">Market Sentiment</Label>
              <Select name="marketSentiment">
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullish">Bullish</SelectItem>
                  <SelectItem value="bearish">Bearish</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Trades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button type="button" variant="outline" onClick={handleFetchTrades} disabled={loadingTrades}>
            {loadingTrades ? 'Loading...' : 'Fetch Trades for Date'}
          </Button>

          {trades.length > 0 && (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Link</th>
                    <th className="px-3 py-2 text-left font-medium">Ticker</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Dir</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedTradeIds.has(t.id)}
                          onChange={() => toggleTrade(t.id)}
                          className="h-4 w-4"
                        />
                        {selectedTradeIds.has(t.id) && (
                          <input type="hidden" name="tradeIds" value={t.id} />
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{t.ticker}</td>
                      <td className="px-3 py-2 uppercase text-muted-foreground">{t.assetClass}</td>
                      <td className="px-3 py-2 uppercase">{t.direction}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {t.exitDate ? 'Closed' : 'Open'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {trades.length === 0 && !loadingTrades && (
            <p className="text-sm text-muted-foreground">
              Click &quot;Fetch Trades for Date&quot; to load trades from the selected date.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Entry'}
        </Button>
      </div>
    </form>
  );
}
