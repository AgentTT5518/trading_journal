import { describe, it, expect, vi } from 'vitest';

// Mock db + trades queries
vi.mock('@/lib/db', () => ({ db: {} }));
const { mockGetTrades } = vi.hoisted(() => ({ mockGetTrades: vi.fn() }));
vi.mock('@/features/trades/services/queries', () => ({
  getTrades: mockGetTrades,
}));

import {
  getDateRangeForPeriod,
  getDaysInPeriod,
  computeGoalProgress,
  computeAllGoalsProgress,
} from '@/features/goals/services/queries';
import type { Goal } from '@/features/goals/types';
import type { TradeWithCalculations } from '@/features/trades/types';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'Test Goal',
    goalType: 'monthly_pnl',
    targetValue: 5000,
    period: 'monthly',
    isActive: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTrade(overrides: Partial<TradeWithCalculations> = {}): TradeWithCalculations {
  return {
    id: 'trade-1',
    assetClass: 'stock',
    ticker: 'AAPL',
    direction: 'long',
    entryDate: '2026-03-10T10:00:00.000Z',
    entryPrice: 100,
    positionSize: 100,
    orderType: null,
    entryTrigger: null,
    exitDate: '2026-03-15T15:00:00.000Z',
    exitPrice: 110,
    exitReason: 'target_hit',
    plannedStopLoss: null,
    actualStopLoss: null,
    plannedTarget1: null,
    plannedTarget2: null,
    plannedTarget3: null,
    riskRewardPlanned: null,
    invalidationLevel: null,
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
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
    // Calculated fields
    grossPnl: 1000,
    netPnl: 1000,
    pnlPercent: 10,
    rMultiple: null,
    holdingDays: 5,
    dte: null,
    status: 'closed',
    exitLegs: [],
    totalExitedQuantity: 0,
    ...overrides,
  } as TradeWithCalculations;
}

// ─── getDateRangeForPeriod ───────────────────────────────────────────────────

describe('getDateRangeForPeriod', () => {
  it('returns correct monthly range', () => {
    const ref = new Date(2026, 2, 15); // March 15, 2026
    const range = getDateRangeForPeriod('monthly', ref);
    expect(range.from).toBe('2026-03-01');
    expect(range.to).toBe('2026-03-31');
  });

  it('handles February correctly', () => {
    const ref = new Date(2026, 1, 10); // Feb 10, 2026 (non-leap year)
    const range = getDateRangeForPeriod('monthly', ref);
    expect(range.from).toBe('2026-02-01');
    expect(range.to).toBe('2026-02-28');
  });

  it('returns correct weekly range (Monday to Sunday)', () => {
    const ref = new Date(2026, 2, 11); // Wednesday March 11, 2026
    const range = getDateRangeForPeriod('weekly', ref);
    expect(range.from).toBe('2026-03-09'); // Monday
    expect(range.to).toBe('2026-03-15'); // Sunday
  });

  it('handles Sunday as end of week', () => {
    const ref = new Date(2026, 2, 15); // Sunday March 15, 2026
    const range = getDateRangeForPeriod('weekly', ref);
    expect(range.from).toBe('2026-03-09');
    expect(range.to).toBe('2026-03-15');
  });
});

// ─── getDaysInPeriod ─────────────────────────────────────────────────────────

describe('getDaysInPeriod', () => {
  it('returns correct monthly days', () => {
    const ref = new Date(2026, 2, 10); // March 10
    const { elapsed, total } = getDaysInPeriod('monthly', ref);
    expect(elapsed).toBe(10);
    expect(total).toBe(31);
  });

  it('returns correct weekly days for Wednesday', () => {
    const ref = new Date(2026, 2, 11); // Wednesday
    const { elapsed, total } = getDaysInPeriod('weekly', ref);
    expect(elapsed).toBe(3); // Wed = day 3 of week
    expect(total).toBe(7);
  });

  it('returns 7 elapsed for Sunday', () => {
    const ref = new Date(2026, 2, 15); // Sunday
    const { elapsed, total } = getDaysInPeriod('weekly', ref);
    expect(elapsed).toBe(7);
    expect(total).toBe(7);
  });
});

// ─── computeGoalProgress ────────────────────────────────────────────────────

describe('computeGoalProgress', () => {
  const refDate = new Date(2026, 2, 15); // March 15, 2026

  describe('monthly_pnl', () => {
    it('computes P&L progress from closed trades', () => {
      const goal = makeGoal({ goalType: 'monthly_pnl', targetValue: 5000 });
      const trades = [
        makeTrade({ netPnl: 1000, status: 'closed' }),
        makeTrade({ id: 't2', netPnl: 500, status: 'closed', entryDate: '2026-03-12T10:00:00.000Z' }),
      ];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.currentValue).toBe(1500);
      expect(result.progressPercent).toBeCloseTo(30, 0);
    });

    it('excludes open trades from P&L calculation', () => {
      const goal = makeGoal({ goalType: 'monthly_pnl', targetValue: 5000 });
      const trades = [
        makeTrade({ netPnl: 1000, status: 'closed' }),
        makeTrade({ id: 't2', netPnl: null, status: 'open', exitDate: null, exitPrice: null, entryDate: '2026-03-12T10:00:00.000Z' }),
      ];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.currentValue).toBe(1000);
    });

    it('excludes trades outside the period', () => {
      const goal = makeGoal({ goalType: 'monthly_pnl', targetValue: 5000 });
      const trades = [
        makeTrade({ netPnl: 1000, status: 'closed' }), // March
        makeTrade({ id: 't2', netPnl: 2000, status: 'closed', entryDate: '2026-02-10T10:00:00.000Z' }), // February
      ];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.currentValue).toBe(1000);
    });

    it('marks as behind pace when progress < pace', () => {
      const goal = makeGoal({ goalType: 'monthly_pnl', targetValue: 10000 });
      const trades = [makeTrade({ netPnl: 500, status: 'closed' })]; // 5% progress at ~48% of month

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.isOnTrack).toBe(false);
    });
  });

  describe('max_loss (inverted logic)', () => {
    it('computes total loss from losing trades', () => {
      const goal = makeGoal({ goalType: 'max_loss', targetValue: 2000 });
      const trades = [
        makeTrade({ netPnl: -500, status: 'closed' }),
        makeTrade({ id: 't2', netPnl: -300, status: 'closed', entryDate: '2026-03-12T10:00:00.000Z' }),
        makeTrade({ id: 't3', netPnl: 1000, status: 'closed', entryDate: '2026-03-13T10:00:00.000Z' }),
      ];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.currentValue).toBe(800); // abs(-500) + abs(-300)
      expect(result.progressPercent).toBe(40); // 800/2000 = 40%
    });

    it('sets isExceeded when loss >= target', () => {
      const goal = makeGoal({ goalType: 'max_loss', targetValue: 1000 });
      const trades = [
        makeTrade({ netPnl: -600, status: 'closed' }),
        makeTrade({ id: 't2', netPnl: -500, status: 'closed', entryDate: '2026-03-12T10:00:00.000Z' }),
      ];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.isExceeded).toBe(true);
      expect(result.isOnTrack).toBe(false);
    });

    it('warns at 80% threshold', () => {
      const goal = makeGoal({ goalType: 'max_loss', targetValue: 1000 });
      const trades = [makeTrade({ netPnl: -850, status: 'closed' })];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.progressPercent).toBe(85);
      expect(result.isOnTrack).toBe(false); // >= 80%
      expect(result.isExceeded).toBe(false); // < 100%
    });

    it('is on track when under 80%', () => {
      const goal = makeGoal({ goalType: 'max_loss', targetValue: 1000 });
      const trades = [makeTrade({ netPnl: -200, status: 'closed' })];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.isOnTrack).toBe(true);
    });
  });

  describe('trade_count', () => {
    it('counts all trades in period (including open)', () => {
      const goal = makeGoal({ goalType: 'trade_count', targetValue: 20 });
      const trades = [
        makeTrade({ status: 'closed' }),
        makeTrade({ id: 't2', status: 'open', exitDate: null, exitPrice: null, entryDate: '2026-03-12T10:00:00.000Z' }),
      ];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.currentValue).toBe(2);
      expect(result.progressPercent).toBe(10); // 2/20
    });
  });

  describe('win_rate', () => {
    it('computes win rate from closed trades', () => {
      const goal = makeGoal({ goalType: 'win_rate', targetValue: 60 });
      const trades = [
        makeTrade({ netPnl: 500, status: 'closed' }),
        makeTrade({ id: 't2', netPnl: 300, status: 'closed', entryDate: '2026-03-11T10:00:00.000Z' }),
        makeTrade({ id: 't3', netPnl: -200, status: 'closed', entryDate: '2026-03-12T10:00:00.000Z' }),
      ];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.currentValue).toBeCloseTo(66.67, 1); // 2/3 = 66.67%
      expect(result.isOnTrack).toBe(true); // 66.67 >= 60
    });

    it('handles zero closed trades', () => {
      const goal = makeGoal({ goalType: 'win_rate', targetValue: 60 });
      const trades: TradeWithCalculations[] = [];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.currentValue).toBe(0);
      expect(result.isOnTrack).toBe(true); // No data yet, benefit of the doubt
    });

    it('marks as not on track when below target', () => {
      const goal = makeGoal({ goalType: 'win_rate', targetValue: 60 });
      const trades = [
        makeTrade({ netPnl: 500, status: 'closed' }),
        makeTrade({ id: 't2', netPnl: -200, status: 'closed', entryDate: '2026-03-11T10:00:00.000Z' }),
        makeTrade({ id: 't3', netPnl: -100, status: 'closed', entryDate: '2026-03-12T10:00:00.000Z' }),
      ];

      const result = computeGoalProgress(goal, trades, refDate);
      expect(result.currentValue).toBeCloseTo(33.33, 1); // 1/3
      expect(result.isOnTrack).toBe(false);
    });
  });

  it('caps progressPercent at 200', () => {
    const goal = makeGoal({ goalType: 'monthly_pnl', targetValue: 100 });
    const trades = [makeTrade({ netPnl: 500, status: 'closed' })];

    const result = computeGoalProgress(goal, trades, refDate);
    expect(result.progressPercent).toBe(200);
  });
});

// ─── computeAllGoalsProgress ────────────────────────────────────────────────

describe('computeAllGoalsProgress', () => {
  it('computes progress for multiple goals', () => {
    const goals = [
      makeGoal({ id: 'g1', goalType: 'monthly_pnl', targetValue: 5000 }),
      makeGoal({ id: 'g2', goalType: 'trade_count', targetValue: 10 }),
    ];
    const trades = [makeTrade({ netPnl: 1000, status: 'closed' })];
    const refDate = new Date(2026, 2, 15);

    const results = computeAllGoalsProgress(goals, trades, refDate);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('g1');
    expect(results[1].id).toBe('g2');
  });

  it('returns empty array for no goals', () => {
    const results = computeAllGoalsProgress([], []);
    expect(results).toHaveLength(0);
  });
});
