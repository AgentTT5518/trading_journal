import { describe, it, expect, vi } from 'vitest';

// Mock the db module to prevent SQLite from trying to open a real database
vi.mock('@/lib/db', () => ({
  db: {},
}));

// Mock getTrades so getHeatmapData can be tested without a real DB
const { mockGetTrades } = vi.hoisted(() => ({ mockGetTrades: vi.fn() }));
vi.mock('@/features/trades/services/queries', () => ({
  getTrades: mockGetTrades,
}));

import {
  computeDailyPnl,
  buildHeatmapData,
  getHeatmapData,
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

describe('computeDailyPnl', () => {
  it('returns empty map for empty trades array', () => {
    const result = computeDailyPnl([]);
    expect(result.size).toBe(0);
  });

  it('returns empty map when all trades are open', () => {
    const openTrade = makeEnrichedTrade({
      exitDate: null,
      exitPrice: null,
    });
    const result = computeDailyPnl([openTrade]);
    expect(result.size).toBe(0);
  });

  it('maps a single closed trade to its exit date', () => {
    const trade = makeEnrichedTrade({
      exitDate: '2024-03-15T15:00:00.000Z',
      exitPrice: 110,
    });
    const result = computeDailyPnl([trade]);
    expect(result.size).toBe(1);

    const entry = result.get('2024-03-15');
    expect(entry).toBeDefined();
    expect(entry!.netPnl).toBe(1000); // (110 - 100) * 100
    expect(entry!.tradeCount).toBe(1);
  });

  it('aggregates multiple trades on the same day', () => {
    const trade1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-03-15T15:00:00.000Z',
      exitPrice: 110,
    });
    const trade2 = makeEnrichedTrade({
      id: 't2',
      ticker: 'MSFT',
      exitDate: '2024-03-15T16:00:00.000Z',
      exitPrice: 95, // loss
    });
    const result = computeDailyPnl([trade1, trade2]);
    expect(result.size).toBe(1);

    const entry = result.get('2024-03-15');
    expect(entry).toBeDefined();
    expect(entry!.tradeCount).toBe(2);
    // trade1: +1000, trade2: -500 = net +500
    expect(entry!.netPnl).toBe(500);
  });

  it('splits P&L across exit leg dates', () => {
    const leg1 = makeExitLeg({
      id: 'leg1',
      exitDate: '2024-03-10T15:00:00.000Z',
      exitPrice: 110,
      quantity: 50,
      fees: 0,
    });
    const leg2 = makeExitLeg({
      id: 'leg2',
      exitDate: '2024-03-15T15:00:00.000Z',
      exitPrice: 120,
      quantity: 50,
      fees: 0,
    });

    const trade = makeEnrichedTrade(
      {
        exitDate: '2024-03-15T15:00:00.000Z',
        exitPrice: null,
        positionSize: 100,
      },
      [leg1, leg2],
    );

    const result = computeDailyPnl([trade]);
    expect(result.size).toBe(2);

    // leg1: (110 - 100) * 50 * 1 = 500
    const march10 = result.get('2024-03-10');
    expect(march10).toBeDefined();
    expect(march10!.netPnl).toBe(500);
    expect(march10!.tradeCount).toBe(1);

    // leg2: (120 - 100) * 50 * 1 = 1000
    const march15 = result.get('2024-03-15');
    expect(march15).toBeDefined();
    expect(march15!.netPnl).toBe(1000);
    expect(march15!.tradeCount).toBe(1);
  });

  it('applies short direction multiplier and option contract multiplier on exit legs', () => {
    const leg = makeExitLeg({
      id: 'leg1',
      exitDate: '2024-03-15T10:00:00.000Z',
      exitPrice: 5,
      quantity: 10,
      fees: 25,
    });

    const trade = makeEnrichedTrade(
      {
        assetClass: 'option',
        direction: 'short',
        entryPrice: 8,
        positionSize: 10,
        contractMultiplier: 100,
        exitDate: '2024-03-15T10:00:00.000Z',
        exitPrice: null,
      },
      [leg],
    );

    const result = computeDailyPnl([trade]);
    const march15 = result.get('2024-03-15');
    expect(march15).toBeDefined();
    // short: dirMultiplier = -1
    // option: multiplier = 100
    // legPnl = (5 - 8) * 10 * 100 * (-1) - 25 = 3000 - 25 = 2975
    expect(march15!.netPnl).toBe(2975);
  });

  it('aggregates multiple exit legs on the same date', () => {
    const leg1 = makeExitLeg({
      id: 'leg1',
      exitDate: '2024-03-15T10:00:00.000Z',
      exitPrice: 110,
      quantity: 50,
      fees: 0,
    });
    const leg2 = makeExitLeg({
      id: 'leg2',
      exitDate: '2024-03-15T14:00:00.000Z',
      exitPrice: 120,
      quantity: 50,
      fees: 0,
    });

    const trade = makeEnrichedTrade(
      {
        exitDate: '2024-03-15T14:00:00.000Z',
        exitPrice: null,
        positionSize: 100,
      },
      [leg1, leg2],
    );

    const result = computeDailyPnl([trade]);
    expect(result.size).toBe(1);

    const march15 = result.get('2024-03-15');
    expect(march15).toBeDefined();
    // leg1: (110 - 100) * 50 = 500
    // leg2: (120 - 100) * 50 = 1000
    // total: 1500
    expect(march15!.netPnl).toBe(1500);
    expect(march15!.tradeCount).toBe(2);
  });

  it('uses default contractMultiplier of 100 when null on option trade', () => {
    const leg = makeExitLeg({
      exitDate: '2024-03-15T10:00:00.000Z',
      exitPrice: 10,
      quantity: 5,
      fees: null as unknown as number,
    });

    const trade = makeEnrichedTrade(
      {
        assetClass: 'option',
        direction: 'long',
        entryPrice: 8,
        positionSize: 5,
        contractMultiplier: null as unknown as number,
        exitDate: '2024-03-15T10:00:00.000Z',
        exitPrice: null,
      },
      [leg],
    );

    const result = computeDailyPnl([trade]);
    const entry = result.get('2024-03-15');
    expect(entry).toBeDefined();
    // (10 - 8) * 5 * 100 * 1 - 0 = 1000
    expect(entry!.netPnl).toBe(1000);
  });

  it('handles closed trade with null exitDate (edge case)', () => {
    // Manually create a trade that's "closed" with null exitDate but has netPnl
    // This tests the exitDate null-check branch (line 50)
    const trade = makeEnrichedTrade({
      exitDate: null,
      exitPrice: 110,
    });
    // Force status to closed for this edge case test
    const forcedTrade = { ...trade, status: 'closed' as const, netPnl: 1000 };
    const result = computeDailyPnl([forcedTrade]);
    expect(result.size).toBe(0); // exitDate is null, so skipped
  });

  it('excludes partial (not fully closed) trades', () => {
    // A trade with exit legs that don't cover the full position → status = 'partial'
    const leg = makeExitLeg({
      exitDate: '2024-03-10T15:00:00.000Z',
      exitPrice: 110,
      quantity: 30, // only 30 of 100
    });

    const trade = makeEnrichedTrade(
      {
        exitDate: null,
        exitPrice: null,
        positionSize: 100,
      },
      [leg],
    );

    expect(trade.status).toBe('partial');
    const result = computeDailyPnl([trade]);
    expect(result.size).toBe(0);
  });
});

describe('buildHeatmapData', () => {
  it('returns 2 months for the reference date', () => {
    const ref = new Date(2024, 2, 15); // March 15, 2024
    const result = buildHeatmapData([], ref);

    expect(result.months).toHaveLength(2);
    expect(result.months[0].year).toBe(2024);
    expect(result.months[0].month).toBe(1); // February
    expect(result.months[0].label).toContain('February');
    expect(result.months[1].year).toBe(2024);
    expect(result.months[1].month).toBe(2); // March
    expect(result.months[1].label).toContain('March');
  });

  it('handles January reference (previous month is December of prior year)', () => {
    const ref = new Date(2024, 0, 15); // January 15, 2024
    const result = buildHeatmapData([], ref);

    expect(result.months[0].year).toBe(2023);
    expect(result.months[0].month).toBe(11); // December
    expect(result.months[1].year).toBe(2024);
    expect(result.months[1].month).toBe(0); // January
  });

  it('populates calendar days with pnl data', () => {
    const trade = makeEnrichedTrade({
      exitDate: '2024-03-15T15:00:00.000Z',
      exitPrice: 110,
    });

    const ref = new Date(2024, 2, 31); // March 2024
    const result = buildHeatmapData([trade], ref);

    const marchMonth = result.months[1];
    // Find the day with pnl
    const day15 = marchMonth.days.find(
      (d) => d.isCurrentMonth && d.dayOfMonth === 15,
    );
    expect(day15).toBeDefined();
    expect(day15!.pnl).toBeDefined();
    expect(day15!.pnl!.netPnl).toBe(1000);
    expect(day15!.pnl!.tradeCount).toBe(1);
  });

  it('days without trades have null pnl', () => {
    const ref = new Date(2024, 2, 31);
    const result = buildHeatmapData([], ref);

    const marchMonth = result.months[1];
    const actualDays = marchMonth.days.filter((d) => d.isCurrentMonth);
    expect(actualDays.length).toBe(31); // March has 31 days
    expect(actualDays.every((d) => d.pnl === null)).toBe(true);
  });

  it('computes maxProfit and maxLoss correctly', () => {
    const trade1 = makeEnrichedTrade({
      id: 't1',
      exitDate: '2024-03-10T15:00:00.000Z',
      exitPrice: 120, // +2000
    });
    const trade2 = makeEnrichedTrade({
      id: 't2',
      exitDate: '2024-03-15T15:00:00.000Z',
      exitPrice: 85, // -1500
    });

    const ref = new Date(2024, 2, 31);
    const result = buildHeatmapData([trade1, trade2], ref);

    expect(result.maxProfit).toBe(2000);
    expect(result.maxLoss).toBe(1500);
  });

  it('maxProfit and maxLoss are 0 when no trades', () => {
    const result = buildHeatmapData([], new Date(2024, 2, 31));
    expect(result.maxProfit).toBe(0);
    expect(result.maxLoss).toBe(0);
  });

  it('defaults to current date when no referenceDate is provided', () => {
    const result = buildHeatmapData([]);
    const now = new Date();
    const currentMonth = result.months[1];
    expect(currentMonth.year).toBe(now.getFullYear());
    expect(currentMonth.month).toBe(now.getMonth());
  });

  it('includes leading empty cells for day-of-week alignment', () => {
    // March 2024 starts on Friday (day index 5)
    const ref = new Date(2024, 2, 31);
    const result = buildHeatmapData([], ref);

    const marchMonth = result.months[1];
    const leadingEmpty = marchMonth.days.filter(
      (d) => !d.isCurrentMonth,
    );
    expect(leadingEmpty.length).toBe(5); // Sun-Thu empty
  });
});

describe('getHeatmapData', () => {
  it('fetches trades and builds heatmap data', async () => {
    const trade = makeEnrichedTrade({
      exitDate: '2024-03-15T15:00:00.000Z',
      exitPrice: 110,
    });
    mockGetTrades.mockResolvedValue([trade]);

    const ref = new Date(2024, 2, 31);
    const result = await getHeatmapData(ref);

    expect(result.months).toHaveLength(2);
    expect(result.maxProfit).toBe(1000);
    expect(mockGetTrades).toHaveBeenCalled();
  });

  it('throws when getTrades fails', async () => {
    mockGetTrades.mockRejectedValue(new Error('DB error'));

    await expect(getHeatmapData()).rejects.toThrow('DB error');
  });
});
