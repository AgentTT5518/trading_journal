import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { enrichTradeWithCalculations } from './calculations';
import { log } from '../logger';
import type { TradeWithCalculations, ExitLeg } from '../types';

export async function getTrades(): Promise<TradeWithCalculations[]> {
  try {
    const rows = await db.query.trades.findMany({
      with: { exitLegs: true },
      orderBy: [desc(trades.entryDate)],
    });
    return rows.map((row) => {
      const { exitLegs, ...trade } = row;
      return enrichTradeWithCalculations(trade, exitLegs as ExitLeg[]);
    });
  } catch (error) {
    log.error('Failed to fetch trades', error as Error);
    throw error;
  }
}

export async function getTradeById(id: string): Promise<TradeWithCalculations | null> {
  try {
    const row = await db.query.trades.findFirst({
      where: eq(trades.id, id),
      with: { exitLegs: true },
    });
    if (!row) return null;
    const { exitLegs, ...trade } = row;
    return enrichTradeWithCalculations(trade, exitLegs as ExitLeg[]);
  } catch (error) {
    log.error('Failed to fetch trade', error as Error, { tradeId: id });
    throw error;
  }
}
