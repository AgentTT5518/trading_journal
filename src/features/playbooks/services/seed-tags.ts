import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { generateId } from '@/lib/ids';
import { sql } from 'drizzle-orm';
import { log } from '../logger';

type TagCategory =
  | 'strategy'
  | 'market_condition'
  | 'timeframe'
  | 'instrument'
  | 'execution'
  | 'mistake';

const PREDEFINED_TAGS: Record<TagCategory, string[]> = {
  strategy: [
    'breakout',
    'pullback',
    'reversal',
    'momentum',
    'mean_reversion',
    'gap_fill',
    'earnings_play',
    'dividend_capture',
  ],
  market_condition: [
    'bull_market',
    'bear_market',
    'range_bound',
    'high_volatility',
    'low_volatility',
    'sector_rotation',
  ],
  timeframe: ['scalp', 'day_trade', 'swing', 'position', 'long_term'],
  instrument: [
    'common_stock',
    'etf',
    'call_option',
    'put_option',
    'spread',
    'futures',
    'crypto_spot',
    'crypto_perp',
  ],
  execution: [
    'perfect_entry',
    'early_entry',
    'late_entry',
    'perfect_exit',
    'early_exit',
    'late_exit',
    'added_to_winner',
    'averaged_down',
  ],
  mistake: [
    'fomo_entry',
    'revenge_trade',
    'oversized',
    'no_stop_loss',
    'moved_stop',
    'ignored_signal',
    'overtraded',
    'held_too_long',
  ],
};

export async function seedPredefinedTags(): Promise<{ inserted: number; skipped: boolean }> {
  try {
    // Idempotency check: skip if tags already exist
    const existing = await db
      .select({ count: sql<number>`count(*)` })
      .from(tags);
    const count = existing[0].count;

    if (count > 0) {
      log.info('Tags already seeded, skipping', { existingCount: count });
      return { inserted: 0, skipped: true };
    }

    const now = new Date().toISOString();
    const rows: { id: string; name: string; category: TagCategory; isCustom: boolean; createdAt: string }[] = [];

    for (const [category, names] of Object.entries(PREDEFINED_TAGS)) {
      for (const name of names) {
        rows.push({
          id: generateId(),
          name,
          category: category as TagCategory,
          isCustom: false,
          createdAt: now,
        });
      }
    }

    await db.insert(tags).values(rows);

    log.info('Predefined tags seeded', { count: rows.length });
    return { inserted: rows.length, skipped: false };
  } catch (error) {
    log.error('Failed to seed tags', error as Error);
    throw error;
  }
}

export { PREDEFINED_TAGS };
