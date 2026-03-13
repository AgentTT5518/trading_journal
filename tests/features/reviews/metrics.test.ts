import { describe, it, expect } from 'vitest';
import { computeReviewMetrics } from '@/features/reviews/services/metrics';

function makeTrade(overrides: Partial<{
  entryPrice: number;
  exitPrice: number | null;
  exitDate: string | null;
  direction: string;
  positionSize: number;
  commissions: number | null;
  fees: number | null;
}> = {}) {
  return {
    entryPrice: 100,
    exitPrice: 110,
    exitDate: '2026-03-05',
    direction: 'long',
    positionSize: 10,
    commissions: 0,
    fees: 0,
    ...overrides,
  };
}

describe('computeReviewMetrics', () => {
  // Zero trades
  it('returns null metrics for zero trades', () => {
    const m = computeReviewMetrics([]);
    expect(m.tradeCount).toBe(0);
    expect(m.winRate).toBeNull();
    expect(m.totalPnl).toBe(0);
    expect(m.avgPnl).toBeNull();
    expect(m.bestPnl).toBeNull();
    expect(m.worstPnl).toBeNull();
  });

  // All open trades (no exit)
  it('returns null metrics when all trades are open', () => {
    const m = computeReviewMetrics([
      makeTrade({ exitPrice: null, exitDate: null }),
      makeTrade({ exitPrice: null, exitDate: null }),
    ]);
    expect(m.tradeCount).toBe(2);
    expect(m.winRate).toBeNull();
    expect(m.totalPnl).toBe(0);
  });

  // Single winning long trade
  it('computes metrics for a single winning long trade', () => {
    const m = computeReviewMetrics([
      makeTrade({ entryPrice: 100, exitPrice: 120, positionSize: 10, direction: 'long' }),
    ]);
    expect(m.tradeCount).toBe(1);
    expect(m.winCount).toBe(1);
    expect(m.lossCount).toBe(0);
    expect(m.winRate).toBe(100);
    expect(m.totalPnl).toBe(200); // (120-100)*10
    expect(m.avgPnl).toBe(200);
    expect(m.bestPnl).toBe(200);
    expect(m.worstPnl).toBe(200);
  });

  // Single losing long trade
  it('computes metrics for a single losing long trade', () => {
    const m = computeReviewMetrics([
      makeTrade({ entryPrice: 100, exitPrice: 90, positionSize: 10, direction: 'long' }),
    ]);
    expect(m.tradeCount).toBe(1);
    expect(m.winCount).toBe(0);
    expect(m.lossCount).toBe(1);
    expect(m.winRate).toBe(0);
    expect(m.totalPnl).toBe(-100);
  });

  // Short trade — winning
  it('computes P&L correctly for a winning short trade', () => {
    const m = computeReviewMetrics([
      makeTrade({ entryPrice: 100, exitPrice: 80, positionSize: 5, direction: 'short' }),
    ]);
    expect(m.totalPnl).toBe(100); // (100-80)*5
    expect(m.winCount).toBe(1);
  });

  // Short trade — losing
  it('computes P&L correctly for a losing short trade', () => {
    const m = computeReviewMetrics([
      makeTrade({ entryPrice: 100, exitPrice: 120, positionSize: 5, direction: 'short' }),
    ]);
    expect(m.totalPnl).toBe(-100); // (100-120)*5
    expect(m.lossCount).toBe(1);
  });

  // Commissions and fees
  it('deducts commissions and fees from P&L', () => {
    const m = computeReviewMetrics([
      makeTrade({
        entryPrice: 100,
        exitPrice: 110,
        positionSize: 10,
        direction: 'long',
        commissions: 5,
        fees: 3,
      }),
    ]);
    // gross = (110-100)*10 = 100, net = 100 - 5 - 3 = 92
    expect(m.totalPnl).toBe(92);
  });

  // All winners
  it('reports 100% win rate when all trades are winners', () => {
    const m = computeReviewMetrics([
      makeTrade({ entryPrice: 100, exitPrice: 110, positionSize: 10 }),
      makeTrade({ entryPrice: 50, exitPrice: 60, positionSize: 20 }),
    ]);
    expect(m.winRate).toBe(100);
    expect(m.winCount).toBe(2);
    expect(m.lossCount).toBe(0);
  });

  // All losers
  it('reports 0% win rate when all trades are losers', () => {
    const m = computeReviewMetrics([
      makeTrade({ entryPrice: 100, exitPrice: 90, positionSize: 10 }),
      makeTrade({ entryPrice: 50, exitPrice: 40, positionSize: 20 }),
    ]);
    expect(m.winRate).toBe(0);
    expect(m.winCount).toBe(0);
    expect(m.lossCount).toBe(2);
  });

  // Mixed winners and losers
  it('computes correct metrics for mixed wins and losses', () => {
    const trades = [
      makeTrade({ entryPrice: 100, exitPrice: 120, positionSize: 10, direction: 'long' }), // +200
      makeTrade({ entryPrice: 100, exitPrice: 90, positionSize: 10, direction: 'long' }),  // -100
      makeTrade({ entryPrice: 50, exitPrice: 70, positionSize: 5, direction: 'long' }),    // +100
    ];
    const m = computeReviewMetrics(trades);
    expect(m.tradeCount).toBe(3);
    expect(m.winCount).toBe(2);
    expect(m.lossCount).toBe(1);
    expect(m.winRate).toBe(67); // Math.round(2/3 * 100)
    expect(m.totalPnl).toBe(200); // 200 - 100 + 100
    expect(m.avgPnl).toBe(66.67); // Math.round(200/3 * 100) / 100
    expect(m.bestPnl).toBe(200);
    expect(m.worstPnl).toBe(-100);
  });

  // Mix of open and closed trades
  it('counts open trades in tradeCount but excludes from P&L', () => {
    const m = computeReviewMetrics([
      makeTrade({ entryPrice: 100, exitPrice: 110, positionSize: 10 }), // closed: +100
      makeTrade({ exitPrice: null, exitDate: null }), // open
    ]);
    expect(m.tradeCount).toBe(2);
    expect(m.winCount).toBe(1);
    expect(m.totalPnl).toBe(100);
    expect(m.winRate).toBe(100); // 1/1 closed
  });

  // Breakeven trade counts as loss (P&L = 0 treated as <= 0)
  it('treats breakeven trade as a loss', () => {
    const m = computeReviewMetrics([
      makeTrade({ entryPrice: 100, exitPrice: 100, positionSize: 10, direction: 'long' }),
    ]);
    expect(m.winCount).toBe(0);
    expect(m.lossCount).toBe(1);
    expect(m.totalPnl).toBe(0);
  });

  // Null commissions/fees
  it('handles null commissions and fees', () => {
    const m = computeReviewMetrics([
      makeTrade({ commissions: null, fees: null }),
    ]);
    // gross = (110-100)*10 = 100, null fees treated as 0
    expect(m.totalPnl).toBe(100);
  });
});
