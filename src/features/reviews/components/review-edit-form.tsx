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
import { RulesListInput } from './rules-list-input';
import { updateReview } from '../services/actions';
import type { ActionState } from '@/features/trades/types';
import type { ReviewWithMetrics } from '../types';

interface ReviewEditFormProps {
  review: ReviewWithMetrics;
}

function parseJsonArray(val: string | null): string[] {
  if (!val) return [];
  try { return JSON.parse(val) as string[]; } catch { return []; }
}

export function ReviewEditForm({ review }: ReviewEditFormProps) {
  const router = useRouter();
  const boundUpdate = updateReview.bind(null, review.id);
  const [state, formAction, isPending] = useActionState<ActionState<{ id: string }>, FormData>(
    boundUpdate,
    { success: false, message: '' }
  );

  useEffect(() => {
    if (state.success && state.data?.id) {
      toast.success('Review updated');
      router.push(`/reviews/${state.data.id}`);
    }
  }, [state, router]);

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
            <Select name="type" defaultValue={review.type}>
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
              <Input id="startDate" name="startDate" type="date" defaultValue={review.startDate} required />
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={review.endDate} required />
            </div>
          </div>

          {/* Preserve linked trade IDs */}
          {review.tradeIds.map((id) => (
            <input key={id} type="hidden" name="tradeIds" value={id} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="grade">Grade</Label>
            <Select name="grade" defaultValue={review.grade ?? undefined}>
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
            <Textarea id="notes" name="notes" rows={4} defaultValue={review.notes ?? ''} />
          </div>

          <div>
            <Label htmlFor="lessonsLearned">Lessons Learned</Label>
            <Textarea id="lessonsLearned" name="lessonsLearned" rows={3} defaultValue={review.lessonsLearned ?? ''} />
          </div>

          <div>
            <Label htmlFor="goalsForNext">Goals for Next Period</Label>
            <Textarea id="goalsForNext" name="goalsForNext" rows={3} defaultValue={review.goalsForNext ?? ''} />
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
            <RulesListInput name="rulesFollowed" label="rule followed" defaultValue={parseJsonArray(review.rulesFollowed)} />
          </div>
          <div>
            <Label>Rules Broken</Label>
            <RulesListInput name="rulesBroken" label="rule broken" defaultValue={parseJsonArray(review.rulesBroken)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
