import { getTrades } from '@/features/trades/services/queries';
import type { TradeWithCalculations } from '@/features/trades/types';
import type { DailyPnl, CalendarDay, HeatmapMonth, HeatmapData } from '../types';
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
