'use server';

import { db } from '@/lib/db';
import { tags, tradeTags, playbooks } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { log } from '../logger';
import type { Tag, TagCategory, TagWithTradeCount, TradeTagWithTag, PlaybookWithTags, PlaybookWithMetrics } from '../types';

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

/**
 * Returns a map of tradeId → tagId[] for all trade-tag associations.
 * Used for client-side tag filtering on the trade list.
 */
export async function getAllTradeTagMap(): Promise<Map<string, string[]>> {
  try {
    const rows = await db
      .select({ tradeId: tradeTags.tradeId, tagId: tradeTags.tagId })
      .from(tradeTags);
    const map = new Map<string, string[]>();
    for (const row of rows) {
      const existing = map.get(row.tradeId);
      if (existing) {
        existing.push(row.tagId);
      } else {
        map.set(row.tradeId, [row.tagId]);
      }
    }
    return map;
  } catch (error) {
    log.error('Failed to fetch all trade tag mappings', error as Error);
    throw error;
  }
}

// ─── Playbook Queries ───────────────────────────────────────────────────────

export async function getPlaybooks(): Promise<PlaybookWithTags[]> {
  try {
    const rows = await db.query.playbooks.findMany({
      with: { tags: true },
      orderBy: [desc(playbooks.updatedAt)],
    });
    return rows as PlaybookWithTags[];
  } catch (error) {
    log.error('Failed to fetch playbooks', error as Error);
    throw error;
  }
}

export async function getPlaybookById(id: string): Promise<PlaybookWithMetrics | null> {
  try {
    const row = await db.query.playbooks.findFirst({
      where: eq(playbooks.id, id),
      with: { tags: true },
    });
    if (!row) return null;

    // Compute metrics: count trades linked via tags in this playbook
    const tagIds = row.tags.map((t) => t.id);
    let tradeCount = 0;
    let winRate: number | null = null;

    if (tagIds.length > 0) {
      // Get unique trade IDs linked to this playbook's tags
      const tradeTagRows = await db
        .select({ tradeId: tradeTags.tradeId })
        .from(tradeTags)
        .where(sql`${tradeTags.tagId} IN (${sql.join(tagIds.map(id => sql`${id}`), sql`, `)})`);

      const uniqueTradeIds = [...new Set(tradeTagRows.map((r) => r.tradeId))];
      tradeCount = uniqueTradeIds.length;

      if (tradeCount > 0) {
        // Import trades table to compute win rate
        const { trades } = await import('@/lib/db/schema');
        const tradeRows = await db
          .select({
            entryPrice: trades.entryPrice,
            exitPrice: trades.exitPrice,
            direction: trades.direction,
            exitDate: trades.exitDate,
          })
          .from(trades)
          .where(sql`${trades.id} IN (${sql.join(uniqueTradeIds.map(id => sql`${id}`), sql`, `)})`);

        const closedTrades = tradeRows.filter((t) => t.exitDate && t.exitPrice);
        if (closedTrades.length > 0) {
          const wins = closedTrades.filter((t) => {
            const pnl = t.direction === 'long'
              ? (t.exitPrice! - t.entryPrice)
              : (t.entryPrice - t.exitPrice!);
            return pnl > 0;
          });
          winRate = Math.round((wins.length / closedTrades.length) * 100);
        }
      }
    }

    return { ...row, tradeCount, winRate } as PlaybookWithMetrics;
  } catch (error) {
    log.error('Failed to fetch playbook by ID', error as Error, { playbookId: id });
    throw error;
  }
}

export async function getPlaybooksWithMetrics(): Promise<PlaybookWithMetrics[]> {
  try {
    const allPlaybooks = await getPlaybooks();
    const results: PlaybookWithMetrics[] = [];

    for (const playbook of allPlaybooks) {
      const tagIds = playbook.tags.map((t) => t.id);
      let tradeCount = 0;
      let winRate: number | null = null;

      if (tagIds.length > 0) {
        const tradeTagRows = await db
          .select({ tradeId: tradeTags.tradeId })
          .from(tradeTags)
          .where(sql`${tradeTags.tagId} IN (${sql.join(tagIds.map(id => sql`${id}`), sql`, `)})`);

        const uniqueTradeIds = [...new Set(tradeTagRows.map((r) => r.tradeId))];
        tradeCount = uniqueTradeIds.length;

        if (tradeCount > 0) {
          const { trades } = await import('@/lib/db/schema');
          const tradeRows = await db
            .select({
              entryPrice: trades.entryPrice,
              exitPrice: trades.exitPrice,
              direction: trades.direction,
              exitDate: trades.exitDate,
            })
            .from(trades)
            .where(sql`${trades.id} IN (${sql.join(uniqueTradeIds.map(id => sql`${id}`), sql`, `)})`);

          const closedTrades = tradeRows.filter((t) => t.exitDate && t.exitPrice);
          if (closedTrades.length > 0) {
            const wins = closedTrades.filter((t) => {
              const pnl = t.direction === 'long'
                ? (t.exitPrice! - t.entryPrice)
                : (t.entryPrice - t.exitPrice!);
              return pnl > 0;
            });
            winRate = Math.round((wins.length / closedTrades.length) * 100);
          }
        }
      }

      results.push({ ...playbook, tradeCount, winRate });
    }

    return results;
  } catch (error) {
    log.error('Failed to fetch playbooks with metrics', error as Error);
    throw error;
  }
}
