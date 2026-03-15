'use server';

import { db } from '@/lib/db';
import { journalEntries, journalTrades } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/ids';
import { journalInsertSchema } from '../validations';
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

export async function createJournalEntry(
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = {
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      title: (formData.get('title') as string) || undefined,
      content: formData.get('content') as string,
      mood: (formData.get('mood') as string) || undefined,
      energy: (formData.get('energy') as string) || undefined,
      marketSentiment: (formData.get('marketSentiment') as string) || undefined,
    };

    const parsed = journalInsertSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: collectFieldErrors(parsed.error.issues),
      };
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(journalEntries).values({
      id,
      date: parsed.data.date,
      category: parsed.data.category,
      title: parsed.data.title ?? null,
      content: parsed.data.content,
      mood: parsed.data.mood ?? null,
      energy: parsed.data.energy ?? null,
      marketSentiment: parsed.data.marketSentiment ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // Link trades
    const tradeIds = formData.getAll('tradeIds').map(String).filter(Boolean);
    if (tradeIds.length > 0) {
      await db.insert(journalTrades).values(
        tradeIds.map((tradeId) => ({
          id: generateId(),
          journalEntryId: id,
          tradeId,
        }))
      );
    }

    log.info('Journal entry created', { entryId: id, category: parsed.data.category });
    revalidatePath('/journal');
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to create journal entry', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updateJournalEntry(
  id: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = {
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      title: (formData.get('title') as string) || undefined,
      content: formData.get('content') as string,
      mood: (formData.get('mood') as string) || undefined,
      energy: (formData.get('energy') as string) || undefined,
      marketSentiment: (formData.get('marketSentiment') as string) || undefined,
    };

    const parsed = journalInsertSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: collectFieldErrors(parsed.error.issues),
      };
    }

    const now = new Date().toISOString();
    await db.update(journalEntries).set({
      date: parsed.data.date,
      category: parsed.data.category,
      title: parsed.data.title ?? null,
      content: parsed.data.content,
      mood: parsed.data.mood ?? null,
      energy: parsed.data.energy ?? null,
      marketSentiment: parsed.data.marketSentiment ?? null,
      updatedAt: now,
    }).where(eq(journalEntries.id, id));

    // Re-link trades
    await db.delete(journalTrades).where(eq(journalTrades.journalEntryId, id));
    const tradeIds = formData.getAll('tradeIds').map(String).filter(Boolean);
    if (tradeIds.length > 0) {
      await db.insert(journalTrades).values(
        tradeIds.map((tradeId) => ({
          id: generateId(),
          journalEntryId: id,
          tradeId,
        }))
      );
    }

    log.info('Journal entry updated', { entryId: id });
    revalidatePath('/journal');
    revalidatePath(`/journal/${id}`);
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to update journal entry', error as Error, { entryId: id });
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function deleteJournalEntry(id: string): Promise<ActionState> {
  try {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
    log.info('Journal entry deleted', { entryId: id });
    revalidatePath('/journal');
    return { success: true };
  } catch (error) {
    log.error('Failed to delete journal entry', error as Error, { entryId: id });
    return { success: false, message: 'Failed to delete journal entry' };
  }
}
