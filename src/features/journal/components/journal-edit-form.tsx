'use client';

import { useActionState, useEffect } from 'react';
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
import { updateJournalEntry } from '../services/actions';
import type { ActionState } from '@/features/trades/types';
import type { JournalEntryWithTrades } from '../types';

interface JournalEditFormProps {
  entry: JournalEntryWithTrades;
}

export function JournalEditForm({ entry }: JournalEditFormProps) {
  const router = useRouter();
  const boundUpdate = updateJournalEntry.bind(null, entry.id);
  const [state, formAction, isPending] = useActionState<ActionState<{ id: string }>, FormData>(
    boundUpdate,
    { success: false, message: '' }
  );

  useEffect(() => {
    if (state.success && state.data?.id) {
      toast.success('Journal entry updated');
      router.push(`/journal/${state.data.id}`);
    }
  }, [state, router]);

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
              <Input id="date" name="date" type="date" defaultValue={entry.date} required />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select name="category" defaultValue={entry.category}>
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
            <Input id="title" name="title" defaultValue={entry.title ?? ''} placeholder="Optional short title..." />
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
            defaultValue={entry.content}
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
              <Select name="mood" defaultValue={entry.mood?.toString() ?? undefined}>
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
              <Select name="energy" defaultValue={entry.energy?.toString() ?? undefined}>
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
              <Select name="marketSentiment" defaultValue={entry.marketSentiment ?? undefined}>
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

      {/* Preserve linked trade IDs */}
      {entry.journalTrades.map((jt) => (
        <input key={jt.id} type="hidden" name="tradeIds" value={jt.tradeId} />
      ))}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
