import type { ReviewMetrics } from '../types';

interface TradeForMetrics {
  entryPrice: number;
  exitPrice: number | null;
  exitDate: string | null;
  direction: string;
  positionSize: number;
  commissions: number | null;
  fees: number | null;
}

export function computeReviewMetrics(trades: TradeForMetrics[]): ReviewMetrics {
  if (trades.length === 0) {
    return {
      tradeCount: 0,
      winCount: 0,
      lossCount: 0,
      winRate: null,
      totalPnl: 0,
      avgPnl: null,
      bestPnl: null,
      worstPnl: null,
    };
  }

  const closedTrades = trades.filter((t) => t.exitDate && t.exitPrice != null);

  if (closedTrades.length === 0) {
    return {
      tradeCount: trades.length,
      winCount: 0,
      lossCount: 0,
      winRate: null,
      totalPnl: 0,
      avgPnl: null,
      bestPnl: null,
      worstPnl: null,
    };
  }

  const pnls = closedTrades.map((t) => {
    const gross =
      t.direction === 'long'
        ? (t.exitPrice! - t.entryPrice) * t.positionSize
        : (t.entryPrice - t.exitPrice!) * t.positionSize;
    return gross - (t.commissions ?? 0) - (t.fees ?? 0);
  });

  const winCount = pnls.filter((p) => p > 0).length;
  const lossCount = pnls.filter((p) => p <= 0).length;
  const totalPnl = pnls.reduce((sum, p) => sum + p, 0);

  return {
    tradeCount: trades.length,
    winCount,
    lossCount,
    winRate: Math.round((winCount / closedTrades.length) * 100),
    totalPnl: Math.round(totalPnl * 100) / 100,
    avgPnl: Math.round((totalPnl / closedTrades.length) * 100) / 100,
    bestPnl: Math.round(Math.max(...pnls) * 100) / 100,
    worstPnl: Math.round(Math.min(...pnls) * 100) / 100,
  };
}
