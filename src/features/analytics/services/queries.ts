import { db } from '@/lib/db';
import { tradeTags, tags } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getTrades } from '@/features/trades/services/queries';
import type { TradeWithCalculations } from '@/features/trades/types';
import type {
  DailyPnl,
  CalendarDay,
  HeatmapMonth,
  HeatmapData,
  MonthlyPnlRow,
  DrawdownPoint,
  RMultipleBucket,
  PlaybookPerformance,
  AdvancedAnalyticsData,
} from '../types';
import { log } from '../logger';

/**
 * Aggregates daily P&L from closed trades.
 * For trades with exit legs, each leg's P&L is attributed to that leg's exit date.
 * For single-exit trades, uses the trade's exitDate.
 *
 * Pure function — no side effects, testable.
 */
export function computeDailyPnl(
  trades: TradeWithCalculations[],
): Map<string, DailyPnl> {
  const byDate = new Map<string, DailyPnl>();

  const closedTrades = trades.filter(
    (t) => t.status === 'closed' && t.netPnl != null,
  );

  for (const trade of closedTrades) {
    if (trade.exitLegs.length > 0) {
      // Per-leg attribution (mirrors computeEquityCurve pattern)
      const dirMultiplier = trade.direction === 'long' ? 1 : -1;
      const multiplier =
        trade.assetClass === 'option'
          ? (trade.contractMultiplier ?? 100)
          : 1;

      for (const leg of trade.exitLegs) {
        const legPnl =
          (leg.exitPrice - trade.entryPrice) *
            leg.quantity *
            multiplier *
            dirMultiplier -
          (leg.fees ?? 0);

        const dateKey = leg.exitDate.slice(0, 10); // YYYY-MM-DD
        const existing = byDate.get(dateKey);
        if (existing) {
          existing.netPnl += legPnl;
          existing.tradeCount += 1;
        } else {
          byDate.set(dateKey, { date: dateKey, netPnl: legPnl, tradeCount: 1 });
        }
      }
    } else {
      const exitDate = trade.exitDate;
      if (exitDate && trade.netPnl != null) {
        const dateKey = exitDate.slice(0, 10);
        const existing = byDate.get(dateKey);
        if (existing) {
          existing.netPnl += trade.netPnl;
          existing.tradeCount += 1;
        } else {
          byDate.set(dateKey, { date: dateKey, netPnl: trade.netPnl, tradeCount: 1 });
        }
      }
    }
  }

  return byDate;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function buildMonth(
  year: number,
  month: number,
  dailyPnl: Map<string, DailyPnl>,
): HeatmapMonth {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const days: CalendarDay[] = [];

  // Leading empty cells for day-of-week alignment
  for (let i = 0; i < firstDay; i++) {
    days.push({
      date: '',
      dayOfMonth: 0,
      isCurrentMonth: false,
      pnl: null,
    });
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      date: dateKey,
      dayOfMonth: d,
      isCurrentMonth: true,
      pnl: dailyPnl.get(dateKey) ?? null,
    });
  }

  return {
    year,
    month,
    label: formatMonthLabel(year, month),
    days,
  };
}

/**
 * Builds the full HeatmapData for 2 months relative to a reference date.
 * Pure function — no side effects, testable.
 *
 * @param trades - All trades (will be filtered to closed)
 * @param referenceDate - Defaults to today. The heatmap shows this month + previous month.
 */
export function buildHeatmapData(
  trades: TradeWithCalculations[],
  referenceDate?: Date,
): HeatmapData {
  const ref = referenceDate ?? new Date();
  const currentYear = ref.getFullYear();
  const currentMonth = ref.getMonth();

  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();

  const dailyPnl = computeDailyPnl(trades);

  const months: HeatmapMonth[] = [
    buildMonth(prevYear, prevMonth, dailyPnl),
    buildMonth(currentYear, currentMonth, dailyPnl),
  ];

  // Compute max profit and max loss for color scaling
  let maxProfit = 0;
  let maxLoss = 0;
  for (const entry of dailyPnl.values()) {
    if (entry.netPnl > maxProfit) maxProfit = entry.netPnl;
    if (entry.netPnl < 0 && Math.abs(entry.netPnl) > maxLoss) {
      maxLoss = Math.abs(entry.netPnl);
    }
  }

  return { months, maxProfit, maxLoss };
}

/**
 * Async wrapper that fetches trades and builds heatmap data.
 */
export async function getHeatmapData(
  referenceDate?: Date,
): Promise<HeatmapData> {
  try {
    const trades = await getTrades();
    return buildHeatmapData(trades, referenceDate);
  } catch (error) {
    log.error('Failed to fetch heatmap data', error as Error);
    throw error;
  }
}

// ─── Advanced Analytics: Pure Functions ──────────────────────────────────────

function getEffectiveExitDate(trade: TradeWithCalculations): string | null {
  if (trade.exitLegs.length > 0) {
    return trade.exitLegs.reduce(
      (latest, leg) => (leg.exitDate > latest ? leg.exitDate : latest),
      trade.exitLegs[0].exitDate,
    );
  }
  return trade.exitDate;
}

function getClosedTrades(trades: TradeWithCalculations[]): TradeWithCalculations[] {
  return trades.filter((t) => t.status === 'closed' && t.netPnl != null);
}

/**
 * Monthly P&L breakdown: aggregates trades by exit month.
 */
export function computeMonthlyPnl(trades: TradeWithCalculations[]): MonthlyPnlRow[] {
  const closed = getClosedTrades(trades);
  const byMonth = new Map<string, TradeWithCalculations[]>();

  for (const trade of closed) {
    const exitDate = getEffectiveExitDate(trade);
    // closed trades always have an exit date (from exitDate or exit legs)
    /* c8 ignore next */
    if (!exitDate) continue;
    const monthKey = exitDate.slice(0, 7); // YYYY-MM
    const existing = byMonth.get(monthKey) ?? [];
    existing.push(trade);
    byMonth.set(monthKey, existing);
  }

  const rows: MonthlyPnlRow[] = [];
  for (const [month, monthTrades] of byMonth) {
    const [year, m] = month.split('-').map(Number);
    const label = new Date(year, m - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    // closedTrades filter guarantees netPnl != null; ?? 0 right-side branches are unreachable
    /* c8 ignore start */
    const netPnl = monthTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
    const wins = monthTrades.filter((t) => (t.netPnl ?? 0) > 0);
    const losses = monthTrades.filter((t) => (t.netPnl ?? 0) < 0);
    /* c8 ignore stop */
    // monthTrades always has at least 1 entry since we iterate over byMonth entries
    /* c8 ignore next */
    const winRate = monthTrades.length > 0
      ? (wins.length / monthTrades.length) * 100
      : 0;

    /* c8 ignore start */
    const grossWins = wins.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
    const grossLosses = Math.abs(losses.reduce((sum, t) => sum + (t.netPnl ?? 0), 0));
    /* c8 ignore stop */
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : null;

    rows.push({ month, label, netPnl, tradeCount: monthTrades.length, winRate, profitFactor });
  }

  rows.sort((a, b) => a.month.localeCompare(b.month));
  return rows;
}

/**
 * Drawdown curve: running peak-to-trough as a series over time.
 */
export function computeDrawdownCurve(trades: TradeWithCalculations[]): DrawdownPoint[] {
  const closed = getClosedTrades(trades);
  if (closed.length === 0) return [];

  type Entry = { date: string; pnl: number };
  const entries: Entry[] = [];

  for (const trade of closed) {
    if (trade.exitLegs.length > 0) {
      const dirMultiplier = trade.direction === 'long' ? 1 : -1;
      // contractMultiplier defaults to 100 in schema; ?? 100 is defensive
      /* c8 ignore next 2 */
      const multiplier = trade.assetClass === 'option'
        ? (trade.contractMultiplier ?? 100)
        : 1;

      for (const leg of trade.exitLegs) {
        /* c8 ignore next 3 */
        const legPnl =
          (leg.exitPrice - trade.entryPrice) * leg.quantity * multiplier * dirMultiplier -
          (leg.fees ?? 0);
        entries.push({ date: leg.exitDate, pnl: legPnl });
      }
    } else {
      const exitDate = trade.exitDate;
      // status='closed' requires exitDate; netPnl != null is pre-filtered — false branches unreachable
      /* c8 ignore start */
      if (exitDate && trade.netPnl != null) {
        entries.push({ date: exitDate, pnl: trade.netPnl });
      }
      /* c8 ignore stop */
    }
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));

  let cumulative = 0;
  let peak = 0;
  const points: DrawdownPoint[] = [];

  for (const entry of entries) {
    cumulative += entry.pnl;
    if (cumulative > peak) peak = cumulative;
    const dd = cumulative - peak; // negative when in drawdown
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    points.push({
      date: entry.date,
      drawdown: dd,
      drawdownPct: ddPct,
    });
  }

  return points;
}

const R_BUCKETS: { label: string; min: number; max: number; isPositive: boolean }[] = [
  { label: '< -3R', min: -Infinity, max: -3, isPositive: false },
  { label: '-3 to -2R', min: -3, max: -2, isPositive: false },
  { label: '-2 to -1R', min: -2, max: -1, isPositive: false },
  { label: '-1 to 0R', min: -1, max: 0, isPositive: false },
  { label: '0 to 1R', min: 0, max: 1, isPositive: true },
  { label: '1 to 2R', min: 1, max: 2, isPositive: true },
  { label: '2 to 3R', min: 2, max: 3, isPositive: true },
  { label: '> 3R', min: 3, max: Infinity, isPositive: true },
];

/**
 * R-multiple distribution buckets for histogram.
 */
export function computeRMultipleBuckets(trades: TradeWithCalculations[]): RMultipleBucket[] {
  const closed = getClosedTrades(trades);
  const rValues = closed
    .map((t) => t.rMultiple)
    .filter((r): r is number => r != null);

  return R_BUCKETS.map((bucket) => ({
    range: bucket.label,
    count: rValues.filter((r) => {
      if (bucket.max === Infinity) return r > bucket.min;
      if (bucket.min === -Infinity) return r <= bucket.max;
      return r > bucket.min && r <= bucket.max;
    }).length,
    isPositive: bucket.isPositive,
  }));
}

/**
 * Sharpe ratio: mean daily return / std deviation of daily returns.
 * Uses risk-free rate of 0 (simplification for trading journal).
 */
export function computeSharpeRatio(trades: TradeWithCalculations[]): number | null {
  const closed = getClosedTrades(trades);
  if (closed.length < 2) return null;

  const dailyPnl = computeDailyPnl(closed);
  const returns = Array.from(dailyPnl.values()).map((d) => d.netPnl);
  if (returns.length < 2) return null;

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return null;
  return mean / stdDev;
}

/**
 * Sortino ratio: mean daily return / downside deviation.
 * Only counts negative returns in the denominator.
 */
export function computeSortinoRatio(trades: TradeWithCalculations[]): number | null {
  const closed = getClosedTrades(trades);
  if (closed.length < 2) return null;

  const dailyPnl = computeDailyPnl(closed);
  const returns = Array.from(dailyPnl.values()).map((d) => d.netPnl);
  if (returns.length < 2) return null;

  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const negativeReturns = returns.filter((r) => r < 0);

  if (negativeReturns.length === 0) return null;

  const downsideVariance = negativeReturns.reduce((s, r) => s + r ** 2, 0) / negativeReturns.length;
  const downsideDev = Math.sqrt(downsideVariance);

  // negativeReturns are all < 0, so their squares are always > 0 → downsideDev > 0
  /* c8 ignore next */
  if (downsideDev === 0) return null;
  return mean / downsideDev;
}

/**
 * Async: fetch trades + playbook data, compute all advanced analytics.
 */
export async function getAdvancedAnalyticsData(): Promise<AdvancedAnalyticsData> {
  try {
    const trades = await getTrades();

    const monthlyPnl = computeMonthlyPnl(trades);
    const drawdownCurve = computeDrawdownCurve(trades);
    const rMultipleBuckets = computeRMultipleBuckets(trades);
    const sharpeRatio = computeSharpeRatio(trades);
    const sortinoRatio = computeSortinoRatio(trades);
    const playbookPerformance = await computePlaybookPerformance(trades);

    return {
      monthlyPnl,
      drawdownCurve,
      rMultipleBuckets,
      sharpeRatio,
      sortinoRatio,
      playbookPerformance,
    };
  } catch (error) {
    log.error('Failed to fetch advanced analytics data', error as Error);
    throw error;
  }
}

/**
 * Playbook performance: win rate, avg P&L, profit factor per playbook.
 * Joins trades → trade_tags → tags → playbooks.
 */
export async function computePlaybookPerformance(
  trades: TradeWithCalculations[],
): Promise<PlaybookPerformance[]> {
  const closed = getClosedTrades(trades);
  if (closed.length === 0) return [];

  // Get all trade-tag-playbook associations
  const rows = await db
    .select({
      tradeId: tradeTags.tradeId,
      playbookId: tags.playbookId,
      playbookName: sql<string>`(SELECT name FROM playbooks WHERE id = ${tags.playbookId})`,
    })
    .from(tradeTags)
    .innerJoin(tags, eq(tradeTags.tagId, tags.id))
    .where(sql`${tags.playbookId} IS NOT NULL`);

  if (rows.length === 0) return [];

  // Group trade IDs by playbook
  const playbookTrades = new Map<string, { name: string; tradeIds: Set<string> }>();
  for (const row of rows) {
    if (!row.playbookId || !row.playbookName) continue;
    const entry = playbookTrades.get(row.playbookId) ?? { name: row.playbookName, tradeIds: new Set() };
    entry.tradeIds.add(row.tradeId);
    playbookTrades.set(row.playbookId, entry);
  }

  // Build a quick lookup for closed trades
  const closedMap = new Map(closed.map((t) => [t.id, t]));

  const results: PlaybookPerformance[] = [];
  for (const [playbookId, { name, tradeIds }] of playbookTrades) {
    const pbTrades = Array.from(tradeIds)
      .map((id) => closedMap.get(id))
      .filter((t): t is TradeWithCalculations => t != null);

    if (pbTrades.length === 0) continue;

    // closedTrades filter guarantees netPnl != null; ?? 0 right-side branches are unreachable
    /* c8 ignore start */
    const totalPnl = pbTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
    const avgPnl = totalPnl / pbTrades.length;
    const wins = pbTrades.filter((t) => (t.netPnl ?? 0) > 0);
    const losses = pbTrades.filter((t) => (t.netPnl ?? 0) < 0);
    const winRate = (wins.length / pbTrades.length) * 100;

    const grossWins = wins.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
    const grossLosses = Math.abs(losses.reduce((sum, t) => sum + (t.netPnl ?? 0), 0));
    /* c8 ignore stop */
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : null;

    results.push({
      playbookId,
      playbookName: name,
      tradeCount: pbTrades.length,
      winRate,
      avgPnl,
      totalPnl,
      profitFactor,
    });
  }

  results.sort((a, b) => b.totalPnl - a.totalPnl);
  return results;
}
