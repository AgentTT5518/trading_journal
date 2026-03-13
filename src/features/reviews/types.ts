import type { InferSelectModel } from 'drizzle-orm';
import type { reviews, reviewTrades } from '@/lib/db/schema';

export type Review = InferSelectModel<typeof reviews>;
export type ReviewTrade = InferSelectModel<typeof reviewTrades>;

export type ReviewType = 'daily' | 'weekly' | 'monthly';
export type ReviewGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type ReviewWithTradeCount = Review & {
  tradeCount: number;
};

export type ReviewMetrics = {
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number | null;
  totalPnl: number;
  avgPnl: number | null;
  bestPnl: number | null;
  worstPnl: number | null;
};

export type ReviewWithMetrics = Review & {
  metrics: ReviewMetrics;
  tradeIds: string[];
};
