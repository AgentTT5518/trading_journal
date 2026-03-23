import type { ReviewMetrics, TradeHighlight, TickerBreakdown } from '../types';

interface TradeForMetrics {
  id: string;
  ticker: string;
  entryPrice: number;
  exitPrice: number | null;
  exitDate: string | null;
  direction: string;
  positionSize: number;
  commissions: number | null;
  fees: number | null;
}

function computeNetPnl(t: TradeForMetrics): number {
  const gross =
    t.direction === 'long'
      ? (t.exitPrice! - t.entryPrice) * t.positionSize
      : (t.entryPrice - t.exitPrice!) * t.positionSize;
  return gross - (t.commissions ?? 0) - (t.fees ?? 0);
}

const emptyMetrics: ReviewMetrics = {
  tradeCount: 0,
  winCount: 0,
  lossCount: 0,
  winRate: null,
  totalPnl: 0,
  avgPnl: null,
  bestPnl: null,
  worstPnl: null,
  bestTrade: null,
  worstTrade: null,
  profitFactor: null,
  tickerBreakdown: [],
};

export function computeReviewMetrics(trades: TradeForMetrics[]): ReviewMetrics {
  if (trades.length === 0) {
    return { ...emptyMetrics };
  }

  const closedTrades = trades.filter((t) => t.exitDate && t.exitPrice != null);

  if (closedTrades.length === 0) {
    return { ...emptyMetrics, tradeCount: trades.length };
  }

  const tradesWithPnl = closedTrades.map((t) => ({
    trade: t,
    pnl: computeNetPnl(t),
  }));

  const pnls = tradesWithPnl.map((tp) => tp.pnl);
  const winCount = pnls.filter((p) => p > 0).length;
  const lossCount = pnls.filter((p) => p <= 0).length;
  const totalPnl = pnls.reduce((sum, p) => sum + p, 0);

  // Best / worst trade identification
  let bestIdx = 0;
  let worstIdx = 0;
  for (let i = 1; i < tradesWithPnl.length; i++) {
    if (tradesWithPnl[i].pnl > tradesWithPnl[bestIdx].pnl) bestIdx = i;
    if (tradesWithPnl[i].pnl < tradesWithPnl[worstIdx].pnl) worstIdx = i;
  }

  const bestEntry = tradesWithPnl[bestIdx];
  const worstEntry = tradesWithPnl[worstIdx];

  const bestTrade: TradeHighlight = {
    id: bestEntry.trade.id,
    ticker: bestEntry.trade.ticker,
    direction: bestEntry.trade.direction,
    netPnl: Math.round(bestEntry.pnl * 100) / 100,
  };

  const worstTrade: TradeHighlight = {
    id: worstEntry.trade.id,
    ticker: worstEntry.trade.ticker,
    direction: worstEntry.trade.direction,
    netPnl: Math.round(worstEntry.pnl * 100) / 100,
  };

  // Profit factor: gross wins / |gross losses| — null when either side is zero
  const grossWins = pnls.filter((p) => p > 0).reduce((s, p) => s + p, 0);
  const grossLosses = Math.abs(pnls.filter((p) => p <= 0).reduce((s, p) => s + p, 0));
  const profitFactor = grossWins > 0 && grossLosses > 0
    ? Math.round((grossWins / grossLosses) * 100) / 100
    : null;

  // Ticker breakdown
  const tickerMap = new Map<string, { pnls: number[] }>();
  for (const tp of tradesWithPnl) {
    const ticker = tp.trade.ticker;
    const entry = tickerMap.get(ticker) ?? { pnls: [] };
    entry.pnls.push(tp.pnl);
    tickerMap.set(ticker, entry);
  }

  const tickerBreakdown: TickerBreakdown[] = Array.from(tickerMap.entries())
    .map(([ticker, data]) => {
      const tickerWins = data.pnls.filter((p) => p > 0).length;
      const tickerTotal = data.pnls.reduce((s, p) => s + p, 0);
      return {
        ticker,
        tradeCount: data.pnls.length,
        winCount: tickerWins,
        winRate: Math.round((tickerWins / data.pnls.length) * 100),
        totalPnl: Math.round(tickerTotal * 100) / 100,
        avgPnl: Math.round((tickerTotal / data.pnls.length) * 100) / 100,
      };
    })
    .sort((a, b) => b.totalPnl - a.totalPnl);

  return {
    tradeCount: trades.length,
    winCount,
    lossCount,
    winRate: Math.round((winCount / closedTrades.length) * 100),
    totalPnl: Math.round(totalPnl * 100) / 100,
    avgPnl: Math.round((totalPnl / closedTrades.length) * 100) / 100,
    bestPnl: Math.round(Math.max(...pnls) * 100) / 100,
    worstPnl: Math.round(Math.min(...pnls) * 100) / 100,
    bestTrade,
    worstTrade,
    profitFactor,
    tickerBreakdown,
  };
}
