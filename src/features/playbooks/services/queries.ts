'use server';

import { db } from '@/lib/db';
import { tags, tradeTags } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { log } from '../logger';
import type { Tag, TagCategory, TagWithTradeCount, TradeTagWithTag } from '../types';

export async function getTags(): Promise<Tag[]> {
  try {
    return await db.select().from(tags).orderBy(tags.category, tags.name);
  } catch (error) {
    log.error('Failed to fetch tags', error as Error);
    throw error;
  }
}

export async function getTagsByCategory(): Promise<Record<TagCategory, Tag[]>> {
  try {
    const allTags = await getTags();
    const grouped: Record<TagCategory, Tag[]> = {
      strategy: [],
      market_condition: [],
      timeframe: [],
      instrument: [],
      execution: [],
      mistake: [],
    };
    for (const tag of allTags) {
      grouped[tag.category as TagCategory].push(tag);
    }
    return grouped;
  } catch (error) {
    log.error('Failed to fetch tags by category', error as Error);
    throw error;
  }
}

export async function getTagsWithTradeCount(): Promise<TagWithTradeCount[]> {
  try {
    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        category: tags.category,
        isCustom: tags.isCustom,
        createdAt: tags.createdAt,
        tradeCount: sql<number>`count(${tradeTags.id})`.as('trade_count'),
      })
      .from(tags)
      .leftJoin(tradeTags, eq(tags.id, tradeTags.tagId))
      .groupBy(tags.id)
      .orderBy(tags.category, tags.name);
    return rows as TagWithTradeCount[];
  } catch (error) {
    log.error('Failed to fetch tags with trade count', error as Error);
    throw error;
  }
}

export async function getTradeTagsForTrade(tradeId: string): Promise<TradeTagWithTag[]> {
  try {
    const rows = await db.query.tradeTags.findMany({
      where: eq(tradeTags.tradeId, tradeId),
      with: { tag: true },
    });
    return rows as TradeTagWithTag[];
  } catch (error) {
    log.error('Failed to fetch trade tags', error as Error, { tradeId });
    throw error;
  }
}

export async function getTagIdsForTrade(tradeId: string): Promise<string[]> {
  try {
    const rows = await db
      .select({ tagId: tradeTags.tagId })
      .from(tradeTags)
      .where(eq(tradeTags.tradeId, tradeId));
    return rows.map((r) => r.tagId);
  } catch (error) {
    log.error('Failed to fetch tag IDs for trade', error as Error, { tradeId });
    throw error;
  }
}
