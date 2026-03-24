'use server';

import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/ids';
import { revalidatePath } from 'next/cache';
import { goalSchema, goalIdSchema } from '../validations';
import { log } from '../logger';
import type { GoalActionState } from '../types';

// ─── Create Goal ─────────────────────────────────────────────────────────────

export async function createGoal(
  _prevState: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  try {
    const raw = Object.fromEntries(formData.entries());

    const parsed = goalSchema.safeParse({
      name: raw.name || '',
      goalType: raw.goalType || '',
      targetValue: raw.targetValue ? Number(raw.targetValue) : undefined,
      period: raw.period || '',
    });

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      }
      return { success: false, message: 'Validation failed', errors };
    }

    const now = new Date().toISOString();
    const id = generateId();

    const [goal] = await db
      .insert(goals)
      .values({
        id,
        ...parsed.data,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    log.info('Goal created', { goalId: id, goalType: parsed.data.goalType });
    revalidatePath('/goals');
    return { success: true, message: 'Goal created', data: goal };
  } catch (error) {
    log.error('Failed to create goal', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

// ─── Update Goal ─────────────────────────────────────────────────────────────

export async function updateGoal(
  _prevState: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const id = raw.id as string;

    const idResult = goalIdSchema.safeParse(id);
    if (!idResult.success) {
      return { success: false, message: 'Invalid goal ID' };
    }

    const parsed = goalSchema.safeParse({
      name: raw.name || '',
      goalType: raw.goalType || '',
      targetValue: raw.targetValue ? Number(raw.targetValue) : undefined,
      period: raw.period || '',
    });

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      }
      return { success: false, message: 'Validation failed', errors };
    }

    const now = new Date().toISOString();

    const [updated] = await db
      .update(goals)
      .set({ ...parsed.data, updatedAt: now })
      .where(eq(goals.id, id))
      .returning();

    if (!updated) {
      return { success: false, message: 'Goal not found' };
    }

    log.info('Goal updated', { goalId: id });
    revalidatePath('/goals');
    return { success: true, message: 'Goal updated', data: updated };
  } catch (error) {
    log.error('Failed to update goal', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

// ─── Delete Goal ─────────────────────────────────────────────────────────────

export async function deleteGoal(goalId: string): Promise<GoalActionState> {
  try {
    const idResult = goalIdSchema.safeParse(goalId);
    if (!idResult.success) {
      return { success: false, message: 'Invalid goal ID' };
    }

    await db.delete(goals).where(eq(goals.id, goalId));

    log.info('Goal deleted', { goalId });
    revalidatePath('/goals');
    return { success: true, message: 'Goal deleted' };
  } catch (error) {
    log.error('Failed to delete goal', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

// ─── Toggle Goal Active ──────────────────────────────────────────────────────

export async function toggleGoalActive(goalId: string): Promise<GoalActionState> {
  try {
    const idResult = goalIdSchema.safeParse(goalId);
    if (!idResult.success) {
      return { success: false, message: 'Invalid goal ID' };
    }

    const existing = await db.query.goals.findFirst({
      where: (g, { eq: eqOp }) => eqOp(g.id, goalId),
    });

    if (!existing) {
      return { success: false, message: 'Goal not found' };
    }

    const now = new Date().toISOString();

    const [updated] = await db
      .update(goals)
      .set({ isActive: !existing.isActive, updatedAt: now })
      .where(eq(goals.id, goalId))
      .returning();

    log.info('Goal toggled', { goalId, isActive: updated.isActive });
    revalidatePath('/goals');
    return { success: true, message: updated.isActive ? 'Goal activated' : 'Goal paused', data: updated };
  } catch (error) {
    log.error('Failed to toggle goal', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}
