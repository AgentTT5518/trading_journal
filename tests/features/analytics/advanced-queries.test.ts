import { describe, it, expect, vi } from 'vitest';

const { mockDbSelect } = vi.hoisted(() => ({ mockDbSelect: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    select: mockDbSelect,
  },
}));

const { mockGetTrades } = vi.hoisted(() => ({ mockGetTrades: vi.fn() }));
vi.mock('@/features/trades/services/queries', () => ({
  getTrades: mockGetTrades,
}));

import { beforeEach } from 'vitest';

// Default: db.select() returns empty results for playbook performance query
function setupEmptyDbMock() {
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  });
}

import {
  computeMonthlyPnl,
  computeDrawdownCurve,
  computeRMultipleBuckets,
  computeSharpeRatio,
  computeSortinoRatio,
  computePlaybookPerformance,
  getAdvancedAnalyticsData,
} from '@/features/analytics/services/queries';
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

function makeEnrichedTrade(
  tradeOverrides: Partial<Trade> = {},
  exitLegs: ExitLeg[] = [],
): TradeWithCalculations {
  const trade = makeTrade(tradeOverrides);
  return enrichTradeWithCalculations(trade, exitLegs);
}

beforeEach(() => {
  vi.clearAllMocks();
  setupEmptyDbMock();
});

// ─── computeMonthlyPnl ─────────────────────────────────────────────────────

describe('computeMonthlyPnl', () => {
  it('returns empty array for no trades', () => {
    expect(computeMonthlyPnl([])).toEqual([]);
  });

  it('returns empty array for only open trades', () => {
    const trade = makeEnrichedTrade({ exitDate: null, exitPrice: null });
    expect(computeMonthlyPnl([trade])).toEqual([]);
  });

  it('groups trades by exit month', () => {
    const jan = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    const feb = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-02-15T15:00:00.000Z',
      exitPrice: 105,
    });

    const result = computeMonthlyPnl([jan, feb]);
    expect(result).toHaveLength(2);
    expect(result[0].month).toBe('2024-01');
    expect(result[0].netPnl).toBe(1000); // (110-100)*100
    expect(result[1].month).toBe('2024-02');
    expect(result[1].netPnl).toBe(500); // (105-100)*100
  });

  it('computes win rate and profit factor per month', () => {
    const win = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    const loss = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 95,
    });

    const result = computeMonthlyPnl([win, loss]);
    expect(result).toHaveLength(1);
    expect(result[0].tradeCount).toBe(2);
    expect(result[0].winRate).toBe(50);
    // grossWins=1000, grossLosses=500
    expect(result[0].profitFactor).toBe(2);
  });

  it('returns null profit factor when no losses', () => {
    const win = makeEnrichedTrade({
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });

    const result = computeMonthlyPnl([win]);
    expect(result[0].profitFactor).toBeNull();
  });

  it('sorts results chronologically', () => {
    const march = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-03-20T15:00:00.000Z',
      exitPrice: 110,
    });
    const jan = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 105,
    });

    const result = computeMonthlyPnl([march, jan]);
    expect(result[0].month).toBe('2024-01');
    expect(result[1].month).toBe('2024-03');
  });
});

// ─── computeDrawdownCurve ───────────────────────────────────────────────────

describe('computeDrawdownCurve', () => {
  it('returns empty array for no trades', () => {
    expect(computeDrawdownCurve([])).toEqual([]);
  });

  it('returns zero drawdown for a single winning trade', () => {
    const trade = makeEnrichedTrade({
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    const result = computeDrawdownCurve([trade]);
    expect(result).toHaveLength(1);
    expect(result[0].drawdown).toBe(0); // no drawdown from peak
  });

  it('computes drawdown after a loss following a win', () => {
    const win = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110, // +1000
    });
    const loss = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 90, // -1000
    });

    const result = computeDrawdownCurve([win, loss]);
    expect(result).toHaveLength(2);
    expect(result[0].drawdown).toBe(0); // at peak
    expect(result[1].drawdown).toBe(-1000); // 0 cumulative, peak was 1000
  });

  it('computes drawdown percentage relative to peak', () => {
    const win = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110, // +1000
    });
    const loss = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 95, // -500
    });

    const result = computeDrawdownCurve([win, loss]);
    expect(result[1].drawdownPct).toBe(-50); // 500/1000 * 100
  });
});

// ─── computeRMultipleBuckets ────────────────────────────────────────────────

describe('computeRMultipleBuckets', () => {
  it('returns 8 buckets with zero counts for no trades', () => {
    const result = computeRMultipleBuckets([]);
    expect(result).toHaveLength(8);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });

  it('places trades in correct buckets', () => {
    const trade = makeEnrichedTrade({
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
      plannedStopLoss: 90, // risk = 10, reward = 10, R = 1.0
    });

    const result = computeRMultipleBuckets([trade]);
    const oneToTwoR = result.find((b) => b.range === '0 to 1R');
    expect(oneToTwoR?.count).toBe(1);
  });
});

// ─── computeSharpeRatio ─────────────────────────────────────────────────────

describe('computeSharpeRatio', () => {
  it('returns null for fewer than 2 trades', () => {
    expect(computeSharpeRatio([])).toBeNull();
    const single = makeEnrichedTrade({
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    expect(computeSharpeRatio([single])).toBeNull();
  });

  it('computes a ratio for multiple trades on different days', () => {
    const t1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110, // +1000
    });
    const t2 = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 105, // +500
    });

    const result = computeSharpeRatio([t1, t2]);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
  });

  it('returns null when only 1 daily return (2 trades same day)', () => {
    const t1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    const t2 = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-20T16:00:00.000Z',
      exitPrice: 105,
    });

    const result = computeSharpeRatio([t1, t2]);
    expect(result).toBeNull(); // only 1 daily return
  });

  it('returns null when all daily returns are identical (stddev=0)', () => {
    // Three trades on different days all with same P&L → stddev = 0
    const t1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
      positionSize: 100,
    });
    const t2 = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-21T15:00:00.000Z',
      exitPrice: 110,
      positionSize: 100,
    });
    const t3 = makeEnrichedTrade({
      id: 't3',
      exitDate: '2024-01-22T15:00:00.000Z',
      exitPrice: 110,
      positionSize: 100,
    });

    const result = computeSharpeRatio([t1, t2, t3]);
    expect(result).toBeNull();
  });
});

// ─── computeSortinoRatio ────────────────────────────────────────────────────

describe('computeSortinoRatio', () => {
  it('returns null for fewer than 2 trades', () => {
    expect(computeSortinoRatio([])).toBeNull();
  });

  it('returns null when there are no negative daily returns', () => {
    const t1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    const t2 = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 105,
    });

    const result = computeSortinoRatio([t1, t2]);
    expect(result).toBeNull(); // no losing days
  });

  it('returns null when only 1 daily return (2 trades same day)', () => {
    const t1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    const t2 = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-20T16:00:00.000Z',
      exitPrice: 95,
    });

    const result = computeSortinoRatio([t1, t2]);
    expect(result).toBeNull(); // only 1 daily return
  });

  it('computes ratio when there are negative returns', () => {
    const t1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110, // +1000
    });
    const t2 = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 95, // -500
    });

    const result = computeSortinoRatio([t1, t2]);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
  });
});

// ─── computeDrawdownCurve with exit legs ────────────────────────────────────

describe('computeDrawdownCurve with exit legs', () => {
  it('computes drawdown from exit legs', () => {
    const leg1: ExitLeg = {
      id: 'leg1',
      tradeId: 'test-id',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
      quantity: 50,
      exitReason: null,
      fees: 0,
      notes: null,
      createdAt: '2024-01-20T15:00:00.000Z',
    };
    const leg2: ExitLeg = {
      id: 'leg2',
      tradeId: 'test-id',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 90,
      quantity: 50,
      exitReason: null,
      fees: 0,
      notes: null,
      createdAt: '2024-01-25T15:00:00.000Z',
    };

    const trade = makeEnrichedTrade(
      { exitDate: '2024-01-25T15:00:00.000Z', exitPrice: null, positionSize: 100 },
      [leg1, leg2],
    );

    const result = computeDrawdownCurve([trade]);
    expect(result).toHaveLength(2);
    // leg1: (110-100)*50 = 500 (peak)
    expect(result[0].drawdown).toBe(0);
    // leg2: (90-100)*50 = -500, cumulative = 0, drawdown = 0 - 500 = -500
    expect(result[1].drawdown).toBe(-500);
  });

  it('handles drawdown percentage when peak is zero', () => {
    const loss = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 90, // -1000, peak stays at 0
    });

    const result = computeDrawdownCurve([loss]);
    expect(result[0].drawdownPct).toBe(0); // peak is 0, can't compute %
  });
});

// ─── computeMonthlyPnl with exit legs ───────────────────────────────────────

describe('computeMonthlyPnl with exit legs', () => {
  it('uses latest exit leg date for monthly grouping with multiple legs', () => {
    const leg1: ExitLeg = {
      id: 'leg1',
      tradeId: 'test-id',
      exitDate: '2024-01-10T15:00:00.000Z',
      exitPrice: 105,
      quantity: 50,
      exitReason: null,
      fees: 0,
      notes: null,
      createdAt: '2024-01-10T15:00:00.000Z',
    };
    const leg2: ExitLeg = {
      id: 'leg2',
      tradeId: 'test-id',
      exitDate: '2024-02-15T15:00:00.000Z',
      exitPrice: 110,
      quantity: 50,
      exitReason: null,
      fees: 0,
      notes: null,
      createdAt: '2024-02-15T15:00:00.000Z',
    };

    const trade = makeEnrichedTrade(
      { exitDate: '2024-02-15T15:00:00.000Z', exitPrice: null, positionSize: 100 },
      [leg1, leg2],
    );

    const result = computeMonthlyPnl([trade]);
    // getEffectiveExitDate returns the latest leg date (Feb), so grouped in Feb
    expect(result).toHaveLength(1);
    expect(result[0].month).toBe('2024-02');
  });

  it('uses exit leg date for monthly grouping', () => {
    const leg: ExitLeg = {
      id: 'leg1',
      tradeId: 'test-id',
      exitDate: '2024-02-15T15:00:00.000Z',
      exitPrice: 110,
      quantity: 100,
      exitReason: null,
      fees: 0,
      notes: null,
      createdAt: '2024-02-15T15:00:00.000Z',
    };

    const trade = makeEnrichedTrade(
      { exitDate: '2024-02-15T15:00:00.000Z', exitPrice: null, positionSize: 100 },
      [leg],
    );

    const result = computeMonthlyPnl([trade]);
    expect(result).toHaveLength(1);
    expect(result[0].month).toBe('2024-02');
  });
});

// ─── computeDrawdownCurve with option trade ─────────────────────────────────

describe('computeDrawdownCurve with option trades', () => {
  it('applies option multiplier on exit legs', () => {
    const leg: ExitLeg = {
      id: 'leg1',
      tradeId: 'test-id',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 5,
      quantity: 10,
      exitReason: null,
      fees: 10,
      notes: null,
      createdAt: '2024-01-20T15:00:00.000Z',
    };

    const trade = makeEnrichedTrade(
      {
        assetClass: 'option',
        direction: 'short',
        entryPrice: 8,
        positionSize: 10,
        contractMultiplier: 100,
        exitDate: '2024-01-20T15:00:00.000Z',
        exitPrice: null,
      },
      [leg],
    );

    const result = computeDrawdownCurve([trade]);
    // short: (5-8)*10*100*(-1) - 10 = 3000 - 10 = 2990
    expect(result[0].drawdown).toBe(0); // profit, no drawdown
  });
});

// ─── computePlaybookPerformance ──────────────────────────────────────────────

describe('computePlaybookPerformance', () => {
  it('returns empty for no closed trades', async () => {
    const result = await computePlaybookPerformance([]);
    expect(result).toEqual([]);
  });

  it('returns empty when db returns no tag-playbook rows', async () => {
    const t1 = makeEnrichedTrade({
      id: 'trade-1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    setupEmptyDbMock();
    const result = await computePlaybookPerformance([t1]);
    expect(result).toEqual([]);
  });
});

// ─── getAdvancedAnalyticsData ───────────────────────────────────────────────

describe('getAdvancedAnalyticsData', () => {
  it('returns analytics data', async () => {
    const t1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    const t2 = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 95,
    });
    mockGetTrades.mockResolvedValue([t1, t2]);

    const result = await getAdvancedAnalyticsData();
    expect(result.monthlyPnl).toHaveLength(1);
    expect(result.drawdownCurve.length).toBeGreaterThan(0);
    expect(result.rMultipleBuckets).toHaveLength(8);
    expect(result.playbookPerformance).toEqual([]);
  });

  it('throws when getTrades fails', async () => {
    mockGetTrades.mockRejectedValue(new Error('DB error'));
    await expect(getAdvancedAnalyticsData()).rejects.toThrow('DB error');
  });

  it('computes playbook performance when db returns trade-tag rows', async () => {
    const t1 = makeEnrichedTrade({
      id: 'trade-1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110, // +1000
    });
    const t2 = makeEnrichedTrade({
      id: 'trade-2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 95, // -500
    });
    mockGetTrades.mockResolvedValue([t1, t2]);

    // Mock db.select to return playbook-tag-trade associations
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { tradeId: 'trade-1', playbookId: 'pb-1', playbookName: 'Breakout' },
            { tradeId: 'trade-2', playbookId: 'pb-1', playbookName: 'Breakout' },
          ]),
        }),
      }),
    });

    const result = await getAdvancedAnalyticsData();
    expect(result.playbookPerformance).toHaveLength(1);
    expect(result.playbookPerformance[0].playbookName).toBe('Breakout');
    expect(result.playbookPerformance[0].tradeCount).toBe(2);
    expect(result.playbookPerformance[0].winRate).toBe(50);
    expect(result.playbookPerformance[0].totalPnl).toBe(500); // 1000 - 500
    expect(result.playbookPerformance[0].profitFactor).toBe(2); // 1000 / 500
  });

  it('skips rows with null playbookId', async () => {
    const t1 = makeEnrichedTrade({
      id: 'trade-1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    mockGetTrades.mockResolvedValue([t1]);

    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { tradeId: 'trade-1', playbookId: null, playbookName: null },
          ]),
        }),
      }),
    });

    const result = await getAdvancedAnalyticsData();
    expect(result.playbookPerformance).toEqual([]);
  });

  it('skips playbooks with no matching closed trades', async () => {
    const openTrade = makeEnrichedTrade({
      id: 'trade-open',
      exitDate: null,
      exitPrice: null,
    });
    mockGetTrades.mockResolvedValue([openTrade]);

    // Return empty since no closed trades
    const result = await getAdvancedAnalyticsData();
    expect(result.playbookPerformance).toEqual([]);
  });

  it('skips playbooks where linked trades are not closed', async () => {
    const t1 = makeEnrichedTrade({
      id: 'trade-1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110,
    });
    mockGetTrades.mockResolvedValue([t1]);

    // DB returns a trade ID that's not in closed trades
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { tradeId: 'nonexistent-trade', playbookId: 'pb-1', playbookName: 'Ghost' },
          ]),
        }),
      }),
    });

    const result = await getAdvancedAnalyticsData();
    expect(result.playbookPerformance).toEqual([]);
  });

  it('handles playbook with only winning trades (null profit factor)', async () => {
    const t1 = makeEnrichedTrade({
      id: 'trade-1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 110, // +1000
    });
    mockGetTrades.mockResolvedValue([t1]);

    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { tradeId: 'trade-1', playbookId: 'pb-1', playbookName: 'Momentum' },
          ]),
        }),
      }),
    });

    const result = await getAdvancedAnalyticsData();
    expect(result.playbookPerformance[0].profitFactor).toBeNull();
    expect(result.playbookPerformance[0].winRate).toBe(100);
  });
});

// ─── computeRMultipleBuckets edge cases ─────────────────────────────────────

describe('computeRMultipleBuckets edge cases', () => {
  it('places extreme R values in boundary buckets', () => {
    // R > 3 bucket
    const bigWin = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-01-20T15:00:00.000Z',
      exitPrice: 150, // huge win
      plannedStopLoss: 90, // risk = 10, reward = 50, R = 5
    });
    // R < -3 bucket
    const bigLoss = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-01-25T15:00:00.000Z',
      exitPrice: 60, // huge loss
      plannedStopLoss: 90, // risk = 10, loss = 40, R = -4
    });

    const result = computeRMultipleBuckets([bigWin, bigLoss]);
    const over3R = result.find((b) => b.range === '> 3R');
    const underNeg3R = result.find((b) => b.range === '< -3R');
    expect(over3R?.count).toBe(1);
    expect(underNeg3R?.count).toBe(1);
  });
});
