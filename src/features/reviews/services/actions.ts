'use server';

import { db } from '@/lib/db';
import { reviews, reviewTrades } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/ids';
import { reviewInsertSchema } from '../validations';
import { log } from '../logger';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@/features/trades/types';

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export async function createReview(
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = {
      type: formData.get('type') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      grade: (formData.get('grade') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      lessonsLearned: (formData.get('lessonsLearned') as string) || undefined,
      goalsForNext: (formData.get('goalsForNext') as string) || undefined,
      rulesFollowed: (formData.get('rulesFollowed') as string) || undefined,
      rulesBroken: (formData.get('rulesBroken') as string) || undefined,
    };

    const parsed = reviewInsertSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: 'Validation failed', errors: collectFieldErrors(parsed.error.issues) };
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(reviews).values({
      id,
      type: parsed.data.type,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      grade: parsed.data.grade ?? null,
      notes: parsed.data.notes ?? null,
      lessonsLearned: parsed.data.lessonsLearned ?? null,
      goalsForNext: parsed.data.goalsForNext ?? null,
      rulesFollowed: parsed.data.rulesFollowed ? JSON.stringify(parsed.data.rulesFollowed) : null,
      rulesBroken: parsed.data.rulesBroken ? JSON.stringify(parsed.data.rulesBroken) : null,
      createdAt: now,
      updatedAt: now,
    });

    // Link trades
    const tradeIds = formData.getAll('tradeIds').map(String).filter(Boolean);
    if (tradeIds.length > 0) {
      await db.insert(reviewTrades).values(
        tradeIds.map((tradeId) => ({
          id: generateId(),
          reviewId: id,
          tradeId,
        }))
      );
    }

    log.info('Review created', { reviewId: id, type: parsed.data.type });
    revalidatePath('/reviews');
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to create review', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updateReview(
  id: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = {
      type: formData.get('type') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      grade: (formData.get('grade') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      lessonsLearned: (formData.get('lessonsLearned') as string) || undefined,
      goalsForNext: (formData.get('goalsForNext') as string) || undefined,
      rulesFollowed: (formData.get('rulesFollowed') as string) || undefined,
      rulesBroken: (formData.get('rulesBroken') as string) || undefined,
    };

    const parsed = reviewInsertSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: 'Validation failed', errors: collectFieldErrors(parsed.error.issues) };
    }

    const now = new Date().toISOString();
    await db.update(reviews).set({
      type: parsed.data.type,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      grade: parsed.data.grade ?? null,
      notes: parsed.data.notes ?? null,
      lessonsLearned: parsed.data.lessonsLearned ?? null,
      goalsForNext: parsed.data.goalsForNext ?? null,
      rulesFollowed: parsed.data.rulesFollowed ? JSON.stringify(parsed.data.rulesFollowed) : null,
      rulesBroken: parsed.data.rulesBroken ? JSON.stringify(parsed.data.rulesBroken) : null,
      updatedAt: now,
    }).where(eq(reviews.id, id));

    // Re-link trades
    await db.delete(reviewTrades).where(eq(reviewTrades.reviewId, id));
    const tradeIds = formData.getAll('tradeIds').map(String).filter(Boolean);
    if (tradeIds.length > 0) {
      await db.insert(reviewTrades).values(
        tradeIds.map((tradeId) => ({
          id: generateId(),
          reviewId: id,
          tradeId,
        }))
      );
    }

    log.info('Review updated', { reviewId: id });
    revalidatePath('/reviews');
    revalidatePath(`/reviews/${id}`);
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to update review', error as Error, { reviewId: id });
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function deleteReview(id: string): Promise<ActionState> {
  try {
    await db.delete(reviews).where(eq(reviews.id, id));
    log.info('Review deleted', { reviewId: id });
    revalidatePath('/reviews');
    return { success: true };
  } catch (error) {
    log.error('Failed to delete review', error as Error, { reviewId: id });
    return { success: false, message: 'Failed to delete review' };
  }
}
