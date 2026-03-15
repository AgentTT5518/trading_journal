import { describe, it, expect } from 'vitest';
import { computeDashboardMetrics } from '@/features/dashboard/services/queries';
import type { Trade, ExitLeg, TradeWithCalculations } from '@/features/trades/types';
import { enrichTradeWithCalculations } from '@/features/trades/services/calculations';

function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 'test-id',
    assetClass: 'stock',
    ticker: 'AAPL',
    direction: 'long',
    entryDate: '2024-01-15T10:00:00.000Z',
    entryPrice: 100,
    positionSize: 100,
    orderType: 'limit',
    entryTrigger: null,
    exitDate: '2024-01-20T15:00:00.000Z',
    exitPrice: 110,
    exitReason: 'target_hit',
    plannedStopLoss: null,
    actualStopLoss: null,
    plannedTarget1: null,
    plannedTarget2: null,
    plannedTarget3: null,
    riskRewardPlanned: null,
    commissions: 0,
    fees: 0,
    notes: null,
    preMood: null,
    preConfidence: null,
    fomoFlag: false,
    revengeFlag: false,
    anxietyDuring: null,
    urgeToExitEarly: null,
    urgeToAdd: null,
    executionSatisfaction: null,
    lessonsLearned: null,
    tradeGrade: null,
    plannedHoldDays: null,
    heldOverWeekend: null,
    heldThroughEarnings: null,
    heldThroughMacro: null,
    weeklyTrend: null,
    marketRegime: null,
    vixLevel: null,
    supportLevel: null,
    resistanceLevel: null,
    sectorPerformance: null,
    upcomingCatalysts: null,
    rsiAtEntry: null,
    macdAtEntry: null,
    distanceFrom50ma: null,
    distanceFrom200ma: null,
    volumeProfile: null,
    atrAtEntry: null,
    exchange: null,
    tradingPair: null,
    makerFee: null,
    takerFee: null,
    networkFee: null,
    fundingRate: null,
    leverage: null,
    liquidationPrice: null,
    marketCapCategory: null,
    tokenType: null,
    btcDominance: null,
    btcCorrelation: null,
    optionType: null,
    strike: null,
    expiry: null,
    contracts: null,
    contractMultiplier: 100,
    delta: null,
    gamma: null,
    theta: null,
    vega: null,
    iv: null,
    ivRank: null,
    spreadId: null,
    spreadType: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  } as Trade;
}

function makeExitLeg(overrides: Partial<ExitLeg> = {}): ExitLeg {
  return {
    id: 'leg-id',
    tradeId: 'test-id',
    exitDate: '2024-01-20T15:00:00.000Z',
    exitPrice: 110,
    quantity: 50,
    exitReason: null,
    fees: 0,
    notes: null,
    createdAt: '2024-01-20T15:00:00.000Z',
    ...overrides,
  };
}

function makeEnrichedTrade(
  tradeOverrides: Partial<Trade> = {},
  exitLegs: ExitLeg[] = [],
): TradeWithCalculations {
  const trade = makeTrade(tradeOverrides);
  return enrichTradeWithCalculations(trade, exitLegs);
}

describe('computeDashboardMetrics', () => {
  describe('empty state', () => {
    it('returns zeroed summary and empty arrays for zero trades', () => {
      const result = computeDashboardMetrics([]);

      expect(result.summary).toEqual({
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        avgRMultiple: null,
      });
      expect(result.equityCurve).toEqual([]);
      expect(result.assetClassBreakdown).toEqual([]);
      expect(result.winLoss).toEqual({ wins: 0, losses: 0 });
      expect(result.recentTrades).toEqual([]);
    });

    it('returns zeroed metrics when only open trades exist', () => {
      const openTrade = makeEnrichedTrade({
        exitDate: null,
        exitPrice: null,
      });

      const result = computeDashboardMetrics([openTrade]);

      expect(result.summary.totalTrades).toBe(0);
      expect(result.summary.totalPnl).toBe(0);
      expect(result.equityCurve).toEqual([]);
      expect(result.recentTrades).toEqual([]);
    });
  });

  describe('summary', () => {
    it('computes correct metrics for a single winning trade', () => {
      // long AAPL: buy 100 @ 100, sell @ 110 → netPnl = 1000
      const trade = makeEnrichedTrade({
        entryPrice: 100,
        exitPrice: 110,
        positionSize: 100,
        direction: 'long',
      });

      const result = computeDashboardMetrics([trade]);

      expect(result.summary.totalPnl).toBe(1000);
      expect(result.summary.winRate).toBe(100);
      expect(result.summary.totalTrades).toBe(1);
    });

    it('computes correct metrics for a single losing trade', () => {
      // long AAPL: buy 100 @ 100, sell @ 90 → netPnl = -1000
      const trade = makeEnrichedTrade({
        entryPrice: 100,
        exitPrice: 90,
        positionSize: 100,
        direction: 'long',
      });

      const result = computeDashboardMetrics([trade]);

      expect(result.summary.totalPnl).toBe(-1000);
      expect(result.summary.winRate).toBe(0);
      expect(result.summary.totalTrades).toBe(1);
    });

    it('computes correct win rate for mixed wins and losses', () => {
      const winner = makeEnrichedTrade({
        id: 'win-1',
        entryPrice: 100,
        exitPrice: 120,
        positionSize: 50,
      });
      const loser = makeEnrichedTrade({
        id: 'loss-1',
        entryPrice: 100,
        exitPrice: 80,
        positionSize: 50,
      });
      const winner2 = makeEnrichedTrade({
        id: 'win-2',
        entryPrice: 50,
        exitPrice: 60,
        positionSize: 100,
      });

      const result = computeDashboardMetrics([winner, loser, winner2]);

      expect(result.summary.totalTrades).toBe(3);
      // 2 wins / 3 trades = 66.67%
      expect(result.summary.winRate).toBeCloseTo(66.67, 1);
      // 1000 + (-1000) + 1000 = 1000
      expect(result.summary.totalPnl).toBe(1000);
    });

    it('returns 100% win rate when all trades are wins', () => {
      const win1 = makeEnrichedTrade({ id: 'w1', exitPrice: 110 });
      const win2 = makeEnrichedTrade({ id: 'w2', exitPrice: 120 });

      const result = computeDashboardMetrics([win1, win2]);

      expect(result.summary.winRate).toBe(100);
    });

    it('computes avgRMultiple from non-null values', () => {
      const t1 = makeEnrichedTrade({
        id: 't1',
        exitPrice: 110,
        plannedStopLoss: 90,
      });
      const t2 = makeEnrichedTrade({
        id: 't2',
        exitPrice: 120,
        plannedStopLoss: 95,
      });
      // t3 has no stop loss → rMultiple will be null
      const t3 = makeEnrichedTrade({
        id: 't3',
        exitPrice: 105,
        plannedStopLoss: null,
      });

      const result = computeDashboardMetrics([t1, t2, t3]);

      expect(result.summary.avgRMultiple).not.toBeNull();
      // Only t1 and t2 contribute to R-multiple average
      const r1 = t1.rMultiple!;
      const r2 = t2.rMultiple!;
      expect(result.summary.avgRMultiple).toBeCloseTo((r1 + r2) / 2, 4);
    });

    it('returns null avgRMultiple when all R-multiples are null', () => {
      const t1 = makeEnrichedTrade({ id: 't1', exitPrice: 110, plannedStopLoss: null });
      const t2 = makeEnrichedTrade({ id: 't2', exitPrice: 120, plannedStopLoss: null });

      const result = computeDashboardMetrics([t1, t2]);

      expect(result.summary.avgRMultiple).toBeNull();
    });
  });

  describe('trades with null netPnl', () => {
    it('excludes trades with null netPnl from all calculations', () => {
      // An open trade will have null netPnl
      const openTrade = makeEnrichedTrade({
        id: 'open',
        exitDate: null,
        exitPrice: null,
      });
      const closedTrade = makeEnrichedTrade({
        id: 'closed',
        exitPrice: 110,
      });

      const result = computeDashboardMetrics([openTrade, closedTrade]);

      expect(result.summary.totalTrades).toBe(1);
      expect(result.summary.totalPnl).toBe(1000);
    });
  });

  describe('equity curve', () => {
    it('produces cumulative points sorted by exit date', () => {
      const early = makeEnrichedTrade({
        id: 'early',
        exitDate: '2024-01-10T15:00:00.000Z',
        exitPrice: 110,
        positionSize: 100,
      });
      const late = makeEnrichedTrade({
        id: 'late',
        exitDate: '2024-01-20T15:00:00.000Z',
        exitPrice: 105,
        positionSize: 100,
      });

      const result = computeDashboardMetrics([late, early]);

      expect(result.equityCurve).toHaveLength(2);
      expect(result.equityCurve[0].date).toBe('2024-01-10T15:00:00.000Z');
      expect(result.equityCurve[0].cumulativePnl).toBe(1000);
      expect(result.equityCurve[1].date).toBe('2024-01-20T15:00:00.000Z');
      expect(result.equityCurve[1].cumulativePnl).toBe(1500);
    });

    it('plots each exit leg at its own date', () => {
      const leg1 = makeExitLeg({
        id: 'leg-1',
        exitDate: '2024-01-18T15:00:00.000Z',
        exitPrice: 105,
        quantity: 50,
        fees: 0,
      });
      const leg2 = makeExitLeg({
        id: 'leg-2',
        exitDate: '2024-01-22T15:00:00.000Z',
        exitPrice: 115,
        quantity: 50,
        fees: 0,
      });

      const trade = makeEnrichedTrade(
        {
          id: 'partial',
          entryPrice: 100,
          positionSize: 100,
          direction: 'long',
          exitDate: null,
          exitPrice: null,
        },
        [leg1, leg2],
      );

      const result = computeDashboardMetrics([trade]);

      expect(result.equityCurve).toHaveLength(2);
      // leg1: (105 - 100) * 50 * 1 * 1 = 250
      expect(result.equityCurve[0].date).toBe('2024-01-18T15:00:00.000Z');
      expect(result.equityCurve[0].cumulativePnl).toBe(250);
      // leg2: (115 - 100) * 50 * 1 * 1 = 750 → cumulative = 1000
      expect(result.equityCurve[1].date).toBe('2024-01-22T15:00:00.000Z');
      expect(result.equityCurve[1].cumulativePnl).toBe(1000);
    });
  });

  describe('asset class breakdown', () => {
    it('groups P&L by asset class', () => {
      const stock = makeEnrichedTrade({
        id: 'stock-1',
        assetClass: 'stock',
        exitPrice: 110,
        positionSize: 100,
      });
      const option = makeEnrichedTrade({
        id: 'option-1',
        assetClass: 'option',
        exitPrice: 2,
        entryPrice: 1,
        positionSize: 10,
        contracts: 10,
        contractMultiplier: 100,
      });
      const crypto = makeEnrichedTrade({
        id: 'crypto-1',
        assetClass: 'crypto',
        ticker: 'BTC',
        exitPrice: 45000,
        entryPrice: 40000,
        positionSize: 0.5,
      });

      const result = computeDashboardMetrics([stock, option, crypto]);

      expect(result.assetClassBreakdown).toHaveLength(3);

      const stockEntry = result.assetClassBreakdown.find((a) => a.assetClass === 'stock')!;
      expect(stockEntry.tradeCount).toBe(1);
      expect(stockEntry.totalPnl).toBe(1000);

      const optionEntry = result.assetClassBreakdown.find((a) => a.assetClass === 'option')!;
      expect(optionEntry.tradeCount).toBe(1);
      expect(optionEntry.totalPnl).toBe(1000); // (2-1)*10*100 = 1000

      const cryptoEntry = result.assetClassBreakdown.find((a) => a.assetClass === 'crypto')!;
      expect(cryptoEntry.tradeCount).toBe(1);
      expect(cryptoEntry.totalPnl).toBe(2500); // (45000-40000)*0.5 = 2500
    });
  });

  describe('win/loss', () => {
    it('counts wins and losses correctly', () => {
      const win = makeEnrichedTrade({ id: 'w', exitPrice: 120 });
      const loss = makeEnrichedTrade({ id: 'l', exitPrice: 80 });
      const loss2 = makeEnrichedTrade({ id: 'l2', exitPrice: 95 });

      const result = computeDashboardMetrics([win, loss, loss2]);

      expect(result.winLoss.wins).toBe(1);
      expect(result.winLoss.losses).toBe(2);
    });

    it('returns zero wins/losses when no trades exist', () => {
      const result = computeDashboardMetrics([]);

      expect(result.winLoss).toEqual({ wins: 0, losses: 0 });
    });
  });

  describe('recent trades', () => {
    it('returns at most 10 trades sorted by exit date descending', () => {
      const trades = Array.from({ length: 15 }, (_, i) =>
        makeEnrichedTrade({
          id: `trade-${i}`,
          ticker: `T${i}`,
          exitDate: `2024-01-${String(i + 1).padStart(2, '0')}T15:00:00.000Z`,
          exitPrice: 110,
        }),
      );

      const result = computeDashboardMetrics(trades);

      expect(result.recentTrades).toHaveLength(10);
      // Most recent first
      expect(result.recentTrades[0].ticker).toBe('T14');
      expect(result.recentTrades[9].ticker).toBe('T5');
    });

    it('includes correct fields in each trade row', () => {
      const trade = makeEnrichedTrade({
        id: 'detail',
        ticker: 'MSFT',
        assetClass: 'stock',
        direction: 'long',
        exitDate: '2024-02-01T15:00:00.000Z',
        exitPrice: 110,
      });

      const result = computeDashboardMetrics([trade]);

      expect(result.recentTrades[0]).toMatchObject({
        id: 'detail',
        ticker: 'MSFT',
        assetClass: 'stock',
        direction: 'long',
        exitDate: '2024-02-01T15:00:00.000Z',
      });
      expect(result.recentTrades[0].netPnl).toBeDefined();
      expect(result.recentTrades[0].pnlPercent).toBeDefined();
    });
  });

  describe('date range filtering', () => {
    it('filters by from date', () => {
      const early = makeEnrichedTrade({
        id: 'early',
        exitDate: '2024-01-05T15:00:00.000Z',
        exitPrice: 110,
      });
      const late = makeEnrichedTrade({
        id: 'late',
        exitDate: '2024-02-15T15:00:00.000Z',
        exitPrice: 105,
      });

      const result = computeDashboardMetrics([early, late], {
        from: '2024-02-01T00:00:00.000Z',
      });

      expect(result.summary.totalTrades).toBe(1);
      expect(result.recentTrades[0].id).toBe('late');
    });

    it('filters by to date', () => {
      const early = makeEnrichedTrade({
        id: 'early',
        exitDate: '2024-01-05T15:00:00.000Z',
        exitPrice: 110,
      });
      const late = makeEnrichedTrade({
        id: 'late',
        exitDate: '2024-02-15T15:00:00.000Z',
        exitPrice: 105,
      });

      const result = computeDashboardMetrics([early, late], {
        to: '2024-01-31T23:59:59.000Z',
      });

      expect(result.summary.totalTrades).toBe(1);
      expect(result.recentTrades[0].id).toBe('early');
    });
  });
});
