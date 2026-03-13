import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { enrichTradeWithCalculations } from './calculations';
import { log } from '../logger';
import type { TradeWithCalculations } from '../types';

export async function getTrades(): Promise<TradeWithCalculations[]> {
  try {
    const allTrades = await db.select().from(trades).orderBy(desc(trades.entryDate));
    return allTrades.map((t) => enrichTradeWithCalculations(t));
  } catch (error) {
    log.error('Failed to fetch trades', error as Error);
    throw error;
  }
}

export async function getTradeById(id: string): Promise<TradeWithCalculations | null> {
  try {
    const result = await db.select().from(trades).where(eq(trades.id, id)).limit(1);
    if (result.length === 0) return null;
    return enrichTradeWithCalculations(result[0]);
  } catch (error) {
    log.error('Failed to fetch trade', error as Error, { tradeId: id });
    throw error;
  }
}
