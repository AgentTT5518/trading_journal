import { getTrades } from '@/features/trades/services/queries';
import type { TradeWithCalculations } from '@/features/trades/types';
import type {
  DashboardData,
  DashboardSummary,
  EquityCurvePoint,
  AssetClassPnl,
  WinLossData,
  RecentTradeRow,
  DashboardFilterOptions,
} from '../types';
import { log } from '../logger';

// NOTE: This reuses getTrades() which fetches ALL trades. For large datasets,
// consider a dedicated query with date range filtering and server-side aggregation.

export function computeDashboardMetrics(
  trades: TradeWithCalculations[],
  options?: DashboardFilterOptions,
): DashboardData {
  let closedTrades = trades.filter(
    (t) => t.status === 'closed' && t.netPnl != null,
  );

  if (options?.from) {
    closedTrades = closedTrades.filter((t) => {
      const exitDate = getEffectiveExitDate(t);
      return exitDate != null && exitDate >= options.from!;
    });
  }
  if (options?.to) {
    closedTrades = closedTrades.filter((t) => {
      const exitDate = getEffectiveExitDate(t);
      return exitDate != null && exitDate <= options.to!;
    });
  }

  const summary = computeSummary(closedTrades);
  const equityCurve = computeEquityCurve(closedTrades);
  const assetClassBreakdown = computeAssetClassBreakdown(closedTrades);
  const winLoss = computeWinLoss(closedTrades);
  const recentTrades = computeRecentTrades(closedTrades);

  return { summary, equityCurve, assetClassBreakdown, winLoss, recentTrades };
}

function getEffectiveExitDate(trade: TradeWithCalculations): string | null {
  if (trade.exitLegs.length > 0) {
    return trade.exitLegs.reduce(
      (latest, leg) => (leg.exitDate > latest ? leg.exitDate : latest),
      trade.exitLegs[0].exitDate,
    );
  }
  return trade.exitDate;
}

function computeSummary(closedTrades: TradeWithCalculations[]): DashboardSummary {
  // closedTrades filter guarantees netPnl != null; ?? 0 right-side branches are unreachable
  /* c8 ignore start */
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
  const wins = closedTrades.filter((t) => (t.netPnl ?? 0) > 0).length;
  /* c8 ignore stop */
  const totalTrades = closedTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const rMultiples = closedTrades
    .map((t) => t.rMultiple)
    .filter((r): r is number => r != null);
  const avgRMultiple =
    rMultiples.length > 0
      ? rMultiples.reduce((sum, r) => sum + r, 0) / rMultiples.length
      : null;

  return { totalPnl, winRate, totalTrades, avgRMultiple };
}

function computeEquityCurve(closedTrades: TradeWithCalculations[]): EquityCurvePoint[] {
  type CurveEntry = { date: string; pnl: number; ticker: string };
  const entries: CurveEntry[] = [];

  for (const trade of closedTrades) {
    if (trade.exitLegs.length > 0) {
      // Per-exit-leg granularity: plot each leg at its own date
      const dirMultiplier = trade.direction === 'long' ? 1 : -1;
      const multiplier = trade.assetClass === 'option'
        ? (trade.contractMultiplier ?? 100)
        : 1;

      for (const leg of trade.exitLegs) {
        const legPnl =
          (leg.exitPrice - trade.entryPrice) * leg.quantity * multiplier * dirMultiplier -
          (leg.fees ?? 0);
        entries.push({ date: leg.exitDate, pnl: legPnl, ticker: trade.ticker });
      }
    } else {
      const exitDate = trade.exitDate;
      // status='closed' requires exitDate; netPnl != null is pre-filtered — false branches unreachable
      /* c8 ignore start */
      if (exitDate && trade.netPnl != null) {
        entries.push({ date: exitDate, pnl: trade.netPnl, ticker: trade.ticker });
      }
      /* c8 ignore stop */
    }
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));

  let cumulative = 0;
  return entries.map((e) => {
    cumulative += e.pnl;
    return { date: e.date, cumulativePnl: cumulative, ticker: e.ticker };
  });
}

function computeAssetClassBreakdown(closedTrades: TradeWithCalculations[]): AssetClassPnl[] {
  const groups = new Map<string, { totalPnl: number; tradeCount: number }>();

  for (const trade of closedTrades) {
    const existing = groups.get(trade.assetClass) ?? { totalPnl: 0, tradeCount: 0 };
    /* c8 ignore start */
    existing.totalPnl += trade.netPnl ?? 0; // closedTrades filter guarantees non-null
    /* c8 ignore stop */
    existing.tradeCount += 1;
    groups.set(trade.assetClass, existing);
  }

  return Array.from(groups.entries()).map(([assetClass, data]) => ({
    assetClass: assetClass as AssetClassPnl['assetClass'],
    totalPnl: data.totalPnl,
    tradeCount: data.tradeCount,
  }));
}

function computeWinLoss(closedTrades: TradeWithCalculations[]): WinLossData {
  // closedTrades filter guarantees netPnl != null; ?? 0 right-side branches are unreachable
  /* c8 ignore start */
  const wins = closedTrades.filter((t) => (t.netPnl ?? 0) > 0).length;
  const losses = closedTrades.filter((t) => (t.netPnl ?? 0) < 0).length;
  /* c8 ignore stop */
  return { wins, losses };
}

function computeRecentTrades(closedTrades: TradeWithCalculations[]): RecentTradeRow[] {
  const sorted = [...closedTrades].sort((a, b) => {
    /* c8 ignore start */
    const dateA = getEffectiveExitDate(a) ?? ''; // closed trades always have exit date
    const dateB = getEffectiveExitDate(b) ?? '';
    /* c8 ignore stop */
    return dateB.localeCompare(dateA);
  });

  return sorted.slice(0, 10).map((t) => ({
    id: t.id,
    ticker: t.ticker,
    assetClass: t.assetClass,
    direction: t.direction,
    /* c8 ignore start */
    exitDate: getEffectiveExitDate(t) ?? '', // closed trades always have exit date
    /* c8 ignore stop */
    netPnl: t.netPnl,
    pnlPercent: t.pnlPercent,
  }));
}

export async function getDashboardData(
  options?: DashboardFilterOptions,
): Promise<DashboardData> {
  try {
    const trades = await getTrades();
    return computeDashboardMetrics(trades, options);
  } catch (error) {
    log.error('Failed to fetch dashboard data', error as Error);
    throw error;
  }
}
