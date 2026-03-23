import { db } from '@/lib/db';
import { playbookRules, tradeRuleChecks, tradeTags, tags } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getTrades } from '@/features/trades/services/queries';
import { getPlaybooks } from '@/features/playbooks/services/queries';
import { log } from '../logger';
import type {
  PlaybookRule,
  TradeRuleCheck,
  RuleAdherenceScore,
  AdherenceCorrelationPoint,
  AdherenceByRuleType,
  AdherenceOverviewData,
  RuleType,
} from '../types';
// TradeWithCalculations used indirectly via getTrades() return type

/** Get all rules for a playbook, ordered by type then sortOrder */
export async function getRulesForPlaybook(playbookId: string): Promise<PlaybookRule[]> {
  try {
    return await db
      .select()
      .from(playbookRules)
      .where(eq(playbookRules.playbookId, playbookId))
      .orderBy(playbookRules.ruleType, playbookRules.sortOrder);
  } catch (error) {
    log.error('Failed to get rules for playbook', error as Error, { playbookId });
    return [];
  }
}

/** Get all rules for a trade via its tagged playbooks */
export async function getRulesForTrade(tradeId: string): Promise<PlaybookRule[]> {
  try {
    // Get playbook IDs linked to this trade through tags
    const tradeTagRows = await db
      .select({ playbookId: tags.playbookId })
      .from(tradeTags)
      .innerJoin(tags, eq(tradeTags.tagId, tags.id))
      .where(eq(tradeTags.tradeId, tradeId));

    const playbookIds = [
      ...new Set(tradeTagRows.map((r) => r.playbookId).filter(Boolean) as string[]),
    ];

    if (playbookIds.length === 0) return [];

    return await db
      .select()
      .from(playbookRules)
      .where(inArray(playbookRules.playbookId, playbookIds))
      .orderBy(playbookRules.ruleType, playbookRules.sortOrder);
  } catch (error) {
    log.error('Failed to get rules for trade', error as Error, { tradeId });
    return [];
  }
}

/** Get rule checks saved for a trade */
export async function getTradeRuleChecks(tradeId: string): Promise<TradeRuleCheck[]> {
  try {
    return await db
      .select()
      .from(tradeRuleChecks)
      .where(eq(tradeRuleChecks.tradeId, tradeId));
  } catch (error) {
    log.error('Failed to get trade rule checks', error as Error, { tradeId });
    return [];
  }
}

/** Compute adherence score for a single trade */
export function computeAdherenceScore(
  tradeId: string,
  playbookId: string,
  playbookName: string,
  rules: PlaybookRule[],
  checks: TradeRuleCheck[]
): RuleAdherenceScore {
  const checkMap = new Map(checks.map((c) => [c.ruleId, c.followed]));
  const ruleChecks = rules.map((rule) => ({
    ruleId: rule.id,
    ruleText: rule.ruleText,
    ruleType: rule.ruleType as RuleType,
    followed: checkMap.get(rule.id) ?? false,
  }));

  const rulesFollowed = ruleChecks.filter((c) => c.followed).length;
  const totalRules = ruleChecks.length;
  const score = totalRules > 0 ? Math.round((rulesFollowed / totalRules) * 100) : 0;

  return {
    tradeId,
    playbookId,
    playbookName,
    totalRules,
    rulesFollowed,
    score,
    ruleChecks,
  };
}

/** Get adherence overview data for the analytics page */
export async function getAdherenceOverviewData(): Promise<AdherenceOverviewData> {
  try {
    const [allTrades, allPlaybooks] = await Promise.all([
      getTrades(),
      getPlaybooks(),
    ]);

    // Only closed trades
    const closedTrades = allTrades.filter((t) => t.status === 'closed');
    if (closedTrades.length === 0) {
      return { averageScore: null, totalTradesScored: 0, correlationPoints: [], byRuleType: [] };
    }

    // Get all rules
    const allRules = await db.select().from(playbookRules);
    if (allRules.length === 0) {
      return { averageScore: null, totalTradesScored: 0, correlationPoints: [], byRuleType: [] };
    }

    // Get all trade-tag relationships to find playbook links
    const allTradeTags = await db
      .select({ tradeId: tradeTags.tradeId, playbookId: tags.playbookId, tagId: tags.id })
      .from(tradeTags)
      .innerJoin(tags, eq(tradeTags.tagId, tags.id));

    // Get all rule checks
    const allChecks = await db.select().from(tradeRuleChecks);
    const checksByTrade = new Map<string, TradeRuleCheck[]>();
    for (const check of allChecks) {
      const existing = checksByTrade.get(check.tradeId) ?? [];
      existing.push(check);
      checksByTrade.set(check.tradeId, existing);
    }

    // Build playbook lookup
    const playbookMap = new Map(allPlaybooks.map((p) => [p.id, p.name]));
    const rulesByPlaybook = new Map<string, PlaybookRule[]>();
    for (const rule of allRules) {
      const existing = rulesByPlaybook.get(rule.playbookId) ?? [];
      existing.push(rule);
      rulesByPlaybook.set(rule.playbookId, existing);
    }

    // Build trade → playbook mapping
    const tradePlaybooks = new Map<string, Set<string>>();
    for (const tt of allTradeTags) {
      if (!tt.playbookId) continue;
      const existing = tradePlaybooks.get(tt.tradeId) ?? new Set();
      existing.add(tt.playbookId);
      tradePlaybooks.set(tt.tradeId, existing);
    }

    const correlationPoints: AdherenceCorrelationPoint[] = [];
    const allRuleTypeChecks: Array<{ ruleType: RuleType; followed: boolean }> = [];
    let totalScore = 0;
    let scoredCount = 0;

    for (const trade of closedTrades) {
      const playbookIds = tradePlaybooks.get(trade.id);
      if (!playbookIds || playbookIds.size === 0) continue;

      const tradeChecks = checksByTrade.get(trade.id) ?? [];
      if (tradeChecks.length === 0) continue;

      // Compute aggregate score across all playbooks for this trade
      let tradeTotal = 0;
      let tradeFollowed = 0;

      for (const pbId of playbookIds) {
        const rules = rulesByPlaybook.get(pbId) ?? [];
        if (rules.length === 0) continue;

        const score = computeAdherenceScore(
          trade.id,
          pbId,
          playbookMap.get(pbId) ?? 'Unknown',
          rules,
          tradeChecks
        );
        tradeTotal += score.totalRules;
        tradeFollowed += score.rulesFollowed;

        // Collect rule type data
        for (const rc of score.ruleChecks) {
          allRuleTypeChecks.push({ ruleType: rc.ruleType, followed: rc.followed });
        }
      }

      if (tradeTotal > 0) {
        const tradeScore = Math.round((tradeFollowed / tradeTotal) * 100);
        totalScore += tradeScore;
        scoredCount++;

        if (trade.netPnl !== null) {
          correlationPoints.push({
            tradeId: trade.id,
            ticker: trade.ticker,
            score: tradeScore,
            netPnl: trade.netPnl,
          });
        }
      }
    }

    // Compute by rule type
    const ruleTypes: RuleType[] = ['entry', 'exit', 'sizing'];
    const byRuleType: AdherenceByRuleType[] = ruleTypes.map((rt) => {
      const checks = allRuleTypeChecks.filter((c) => c.ruleType === rt);
      const followed = checks.filter((c) => c.followed).length;
      return {
        ruleType: rt,
        totalChecks: checks.length,
        followedCount: followed,
        rate: checks.length > 0 ? Math.round((followed / checks.length) * 100) : 0,
      };
    }).filter((rt) => rt.totalChecks > 0);

    return {
      averageScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : null,
      totalTradesScored: scoredCount,
      correlationPoints,
      byRuleType,
    };
  } catch (error) {
    log.error('Failed to get adherence overview data', error as Error);
    return { averageScore: null, totalTradesScored: 0, correlationPoints: [], byRuleType: [] };
  }
}
