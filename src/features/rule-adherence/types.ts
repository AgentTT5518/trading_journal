import type { InferSelectModel } from 'drizzle-orm';
import type { playbookRules, tradeRuleChecks } from '@/lib/db/schema';

export type PlaybookRule = InferSelectModel<typeof playbookRules>;
export type TradeRuleCheck = InferSelectModel<typeof tradeRuleChecks>;

export type RuleType = 'entry' | 'exit' | 'sizing';

export type RuleCheckState = {
  ruleId: string;
  followed: boolean;
};

export type RuleAdherenceScore = {
  tradeId: string;
  playbookId: string;
  playbookName: string;
  totalRules: number;
  rulesFollowed: number;
  score: number; // 0-100
  ruleChecks: Array<{
    ruleId: string;
    ruleText: string;
    ruleType: RuleType;
    followed: boolean;
  }>;
};

export type AdherenceCorrelationPoint = {
  tradeId: string;
  ticker: string;
  score: number;
  netPnl: number;
};

export type AdherenceByRuleType = {
  ruleType: RuleType;
  totalChecks: number;
  followedCount: number;
  rate: number; // 0-100
};

export type AdherenceOverviewData = {
  averageScore: number | null;
  totalTradesScored: number;
  correlationPoints: AdherenceCorrelationPoint[];
  byRuleType: AdherenceByRuleType[];
};
