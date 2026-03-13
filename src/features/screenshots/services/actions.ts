'use server';

import { db } from '@/lib/db';
import { screenshots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { log } from '../logger';
import { deleteFile } from './storage';
import type { ActionState } from '@/features/trades/types';

export async function deleteScreenshot(id: string, tradeId: string): Promise<ActionState> {
  try {
    // Get filename before deleting
    const rows = await db.select({ filename: screenshots.filename }).from(screenshots).where(eq(screenshots.id, id));
    if (rows.length === 0) {
      return { success: false, message: 'Screenshot not found' };
    }

    // Delete DB row
    await db.delete(screenshots).where(eq(screenshots.id, id));

    // Delete file from disk (best-effort)
    await deleteFile(tradeId, rows[0].filename);

    log.info('Screenshot deleted', { screenshotId: id, tradeId });
    revalidatePath(`/trades/${tradeId}`);
    return { success: true };
  } catch (error) {
    log.error('Failed to delete screenshot', error as Error, { screenshotId: id });
    return { success: false, message: 'Failed to delete screenshot' };
  }
}
