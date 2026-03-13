'use server';

import { db } from '@/lib/db';
import { screenshots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '../logger';
import type { Screenshot } from '../types';

export async function getScreenshotsForTrade(tradeId: string): Promise<Screenshot[]> {
  try {
    return await db.select().from(screenshots).where(eq(screenshots.tradeId, tradeId));
  } catch (error) {
    log.error('Failed to fetch screenshots', error as Error, { tradeId });
    throw error;
  }
}
