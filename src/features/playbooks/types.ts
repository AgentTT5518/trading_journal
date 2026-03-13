import type { InferSelectModel } from 'drizzle-orm';
import type { tags, tradeTags } from '@/lib/db/schema';

export type Tag = InferSelectModel<typeof tags>;
export type TradeTag = InferSelectModel<typeof tradeTags>;

export type TagCategory =
  | 'strategy'
  | 'market_condition'
  | 'timeframe'
  | 'instrument'
  | 'execution'
  | 'mistake';

export type TagWithTradeCount = Tag & {
  tradeCount: number;
};

export type TradeTagWithTag = TradeTag & {
  tag: Tag;
};
