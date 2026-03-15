import type { InferSelectModel } from 'drizzle-orm';
import type { journalEntries, journalTrades } from '@/lib/db/schema';

export type JournalEntry = InferSelectModel<typeof journalEntries>;
export type JournalTrade = InferSelectModel<typeof journalTrades>;

export type JournalCategory = 'pre_market' | 'post_market' | 'intraday' | 'general' | 'lesson';
export type JournalMarketSentiment = 'bullish' | 'bearish' | 'neutral' | 'uncertain';

export type JournalEntryWithTrades = JournalEntry & {
  journalTrades: (JournalTrade & {
    trade: {
      id: string;
      ticker: string;
      assetClass: string;
      direction: string;
      entryDate: string;
      exitDate: string | null;
    };
  })[];
};

export type JournalEntryWithTradeCount = JournalEntry & {
  tradeCount: number;
};
