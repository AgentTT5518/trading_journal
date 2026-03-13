'use server';

import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/ids';
import { tradeInsertSchema } from '../validations';
import { log } from '../logger';
import type { ActionState } from '../types';
import { revalidatePath } from 'next/cache';

/** Parse FormData into the shape tradeInsertSchema expects */
function parseTradeFormData(raw: Record<string, FormDataEntryValue>) {
  return {
    assetClass: raw.assetClass || undefined,
    ticker: raw.ticker || undefined,
    direction: raw.direction || undefined,
    entryDate: raw.entryDate || undefined,
    entryPrice: raw.entryPrice ? Number(raw.entryPrice) : undefined,
    positionSize: raw.positionSize ? Number(raw.positionSize) : undefined,
    orderType: raw.orderType || undefined,
    entryTrigger: raw.entryTrigger || undefined,
    exitDate: raw.exitDate || undefined,
    exitPrice: raw.exitPrice ? Number(raw.exitPrice) : undefined,
    exitReason: raw.exitReason || undefined,
    commissions: raw.commissions ? Number(raw.commissions) : 0,
    fees: raw.fees ? Number(raw.fees) : 0,
    notes: raw.notes || undefined,
  };
}

export async function createTrade(
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = tradeInsertSchema.safeParse(parseTradeFormData(raw));

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return {
        success: false,
        message: 'Validation failed',
        errors: fieldErrors,
      };
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(trades).values({
      id,
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    });

    log.info('Trade created', { tradeId: id, ticker: parsed.data.ticker });
    revalidatePath('/trades');
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to create trade', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updateTrade(
  id: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = tradeInsertSchema.safeParse(parseTradeFormData(raw));

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return {
        success: false,
        message: 'Validation failed',
        errors: fieldErrors,
      };
    }

    const now = new Date().toISOString();
    await db
      .update(trades)
      .set({ ...parsed.data, updatedAt: now })
      .where(eq(trades.id, id));

    log.info('Trade updated', { tradeId: id, ticker: parsed.data.ticker });
    revalidatePath('/trades');
    revalidatePath(`/trades/${id}`);
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to update trade', error as Error, { tradeId: id });
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function deleteTrade(id: string): Promise<ActionState> {
  try {
    await db.delete(trades).where(eq(trades.id, id));
    log.info('Trade deleted', { tradeId: id });
    revalidatePath('/trades');
    return { success: true };
  } catch (error) {
    log.error('Failed to delete trade', error as Error, { tradeId: id });
    return { success: false, message: 'Failed to delete trade' };
  }
}
