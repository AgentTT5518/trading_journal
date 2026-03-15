'use server';

import { db } from '@/lib/db';
import { journalEntries, journalTrades, trades } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { log } from '../logger';
import type { JournalEntryWithTradeCount, JournalEntryWithTrades } from '../types';

export async function getJournalEntries(): Promise<JournalEntryWithTradeCount[]> {
  try {
    const rows = await db
      .select({
        id: journalEntries.id,
        date: journalEntries.date,
        category: journalEntries.category,
        title: journalEntries.title,
        content: journalEntries.content,
        mood: journalEntries.mood,
        energy: journalEntries.energy,
        marketSentiment: journalEntries.marketSentiment,
        createdAt: journalEntries.createdAt,
        updatedAt: journalEntries.updatedAt,
        tradeCount: sql<number>`count(${journalTrades.id})`.as('trade_count'),
      })
      .from(journalEntries)
      .leftJoin(journalTrades, eq(journalEntries.id, journalTrades.journalEntryId))
      .groupBy(journalEntries.id)
      .orderBy(desc(journalEntries.date), desc(journalEntries.createdAt));

    return rows as JournalEntryWithTradeCount[];
  } catch (error) {
    log.error('Failed to fetch journal entries', error as Error);
    throw error;
  }
}

export async function getJournalEntryById(id: string): Promise<JournalEntryWithTrades | null> {
  try {
    const row = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, id))
      .limit(1);

    if (row.length === 0) return null;

    const entry = row[0];

    const linkedTrades = await db
      .select({
        id: journalTrades.id,
        journalEntryId: journalTrades.journalEntryId,
        tradeId: journalTrades.tradeId,
        trade: {
          id: trades.id,
          ticker: trades.ticker,
          assetClass: trades.assetClass,
          direction: trades.direction,
          entryDate: trades.entryDate,
          exitDate: trades.exitDate,
        },
      })
      .from(journalTrades)
      .innerJoin(trades, eq(journalTrades.tradeId, trades.id))
      .where(eq(journalTrades.journalEntryId, id));

    return { ...entry, journalTrades: linkedTrades };
  } catch (error) {
    log.error('Failed to fetch journal entry by ID', error as Error, { entryId: id });
    throw error;
  }
}

export async function getTradesForDate(
  date: string
): Promise<{ id: string; ticker: string; assetClass: string; direction: string; entryDate: string; exitDate: string | null }[]> {
  try {
    const rows = await db
      .select({
        id: trades.id,
        ticker: trades.ticker,
        assetClass: trades.assetClass,
        direction: trades.direction,
        entryDate: trades.entryDate,
        exitDate: trades.exitDate,
      })
      .from(trades)
      .where(eq(trades.entryDate, date))
      .orderBy(trades.entryDate);

    return rows;
  } catch (error) {
    log.error('Failed to fetch trades for date', error as Error, { date });
    throw error;
  }
}
