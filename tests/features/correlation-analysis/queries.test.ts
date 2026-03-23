import { describe, it, expect, vi } from 'vitest';

// Mock DB and external dependencies
vi.mock('@/lib/db', () => ({ db: {} }));
const { mockGetTrades } = vi.hoisted(() => ({ mockGetTrades: vi.fn() }));
vi.mock('@/features/trades/services/queries', () => ({
  getTrades: mockGetTrades,
}));

import {
  computePearsonCorrelation,
  computeCorrelationPairs,
  computeBooleanCorrelations,
  generateInsights,
  getCorrelationData,
} from '@/features/correlation-analysis/services/queries';
import type { TradeWithCalculations } from '@/features/trades/types';

function makeClosedTrade(overrides: Partial<TradeWithCalculations> = {}): TradeWithCalculations {
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
    invalidationLevel: null,
    commissions: 0,
    fees: 0,
    notes: null,
    preMood: 7,
    preConfidence: 8,
    fomoFlag: false,
    revengeFlag: false,
    anxietyDuring: 3,
    urgeToExitEarly: false,
    urgeToAdd: false,
    executionSatisfaction: 8,
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
    // Calculated fields
    grossPnl: 1000,
    netPnl: 1000,
    pnlPercent: 10,
    rMultiple: 2,
    holdingDays: 5,
    dte: null,
    status: 'closed',
    exitLegs: [],
    totalExitedQuantity: 0,
    ...overrides,
  } as TradeWithCalculations;
}

// ────────────────────────────────────────────────────────
// computePearsonCorrelation
// ────────────────────────────────────────────────────────
describe('computePearsonCorrelation', () => {
  it('returns r=0, n for fewer than 3 data points', () => {
    const result = computePearsonCorrelation([1, 2], [3, 4]);
    expect(result).toEqual({ r: 0, n: 2 });
  });

  it('computes perfect positive correlation', () => {
    const result = computePearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(result.r).toBeCloseTo(1.0, 5);
    expect(result.n).toBe(5);
  });

  it('computes perfect negative correlation', () => {
    const result = computePearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    expect(result.r).toBeCloseTo(-1.0, 5);
  });

  it('computes zero correlation for uncorrelated data', () => {
    const result = computePearsonCorrelation([1, 2, 3, 4, 5], [2, 1, 2, 1, 2]);
    expect(Math.abs(result.r)).toBeLessThan(0.5);
  });

  it('returns r=0 when all values are the same (zero variance)', () => {
    const result = computePearsonCorrelation([5, 5, 5], [1, 2, 3]);
    expect(result.r).toBe(0);
  });
});

// ────────────────────────────────────────────────────────
// computeCorrelationPairs
// ────────────────────────────────────────────────────────
describe('computeCorrelationPairs', () => {
  it('returns empty array when fewer than 3 trades', () => {
    const trades = [makeClosedTrade(), makeClosedTrade({ id: 't2' })];
    const pairs = computeCorrelationPairs(trades);
    expect(pairs).toEqual([]);
  });

  it('generates correlation pairs for trades with psychology data', () => {
    const trades = [
      makeClosedTrade({ id: 't1', preMood: 3, netPnl: -500, pnlPercent: -5, rMultiple: -1 }),
      makeClosedTrade({ id: 't2', preMood: 5, netPnl: 200, pnlPercent: 2, rMultiple: 0.5 }),
      makeClosedTrade({ id: 't3', preMood: 8, netPnl: 1000, pnlPercent: 10, rMultiple: 2 }),
      makeClosedTrade({ id: 't4', preMood: 9, netPnl: 1500, pnlPercent: 15, rMultiple: 3 }),
    ];

    const pairs = computeCorrelationPairs(trades);

    // Should have pairs for each psychology field × P&L metric
    expect(pairs.length).toBeGreaterThan(0);

    // preMood vs netPnl should be positively correlated
    const moodVsPnl = pairs.find((p) => p.xField === 'preMood' && p.yField === 'netPnl');
    expect(moodVsPnl).toBeDefined();
    expect(moodVsPnl!.correlation).toBeGreaterThan(0);
    expect(moodVsPnl!.sampleSize).toBe(4);
  });

  it('skips trades with null psychology fields', () => {
    const trades = [
      makeClosedTrade({ id: 't1', preMood: 5, netPnl: 100 }),
      makeClosedTrade({ id: 't2', preMood: null, netPnl: 200 }),
      makeClosedTrade({ id: 't3', preMood: 8, netPnl: 300 }),
      makeClosedTrade({ id: 't4', preMood: 3, netPnl: -100 }),
    ];

    const pairs = computeCorrelationPairs(trades);
    const moodPair = pairs.find((p) => p.xField === 'preMood' && p.yField === 'netPnl');
    // The null-mood trade should be excluded
    expect(moodPair?.sampleSize).toBe(3);
  });

  it('ignores open trades', () => {
    const trades = [
      makeClosedTrade({ id: 't1', preMood: 5, netPnl: 100 }),
      makeClosedTrade({ id: 't2', preMood: 7, netPnl: 200, status: 'open' as const }),
      makeClosedTrade({ id: 't3', preMood: 8, netPnl: 300 }),
      makeClosedTrade({ id: 't4', preMood: 3, netPnl: -100 }),
    ];

    const pairs = computeCorrelationPairs(trades);
    const moodPair = pairs.find((p) => p.xField === 'preMood' && p.yField === 'netPnl');
    expect(moodPair?.sampleSize).toBe(3);
  });
});

// ────────────────────────────────────────────────────────
// computeBooleanCorrelations
// ────────────────────────────────────────────────────────
describe('computeBooleanCorrelations', () => {
  it('computes average P&L for boolean flags', () => {
    const trades = [
      makeClosedTrade({ id: 't1', fomoFlag: true, netPnl: -500 }),
      makeClosedTrade({ id: 't2', fomoFlag: true, netPnl: -300 }),
      makeClosedTrade({ id: 't3', fomoFlag: false, netPnl: 200 }),
      makeClosedTrade({ id: 't4', fomoFlag: false, netPnl: 400 }),
    ];

    const boolCorr = computeBooleanCorrelations(trades);
    const fomo = boolCorr.find((bc) => bc.field === 'fomoFlag');

    expect(fomo).toBeDefined();
    expect(fomo!.trueAvgPnl).toBe(-400);
    expect(fomo!.falseAvgPnl).toBe(300);
    expect(fomo!.pnlDifference).toBe(-700);
    expect(fomo!.trueCount).toBe(2);
    expect(fomo!.falseCount).toBe(2);
  });

  it('handles all false values', () => {
    const trades = [
      makeClosedTrade({ id: 't1', revengeFlag: false, netPnl: 100 }),
      makeClosedTrade({ id: 't2', revengeFlag: false, netPnl: 200 }),
    ];

    const boolCorr = computeBooleanCorrelations(trades);
    const revenge = boolCorr.find((bc) => bc.field === 'revengeFlag');
    expect(revenge).toBeDefined();
    expect(revenge!.trueCount).toBe(0);
    expect(revenge!.falseCount).toBe(2);
  });
});

// ────────────────────────────────────────────────────────
// generateInsights
// ────────────────────────────────────────────────────────
describe('generateInsights', () => {
  it('generates insights for significant correlations', () => {
    const pairs = [
      {
        xField: 'preMood',
        xLabel: 'Pre-Trade Mood',
        yField: 'netPnl',
        yLabel: 'Net P&L ($)',
        correlation: 0.65,
        sampleSize: 20,
        dataPoints: [],
      },
    ];

    const insights = generateInsights(pairs, []);
    expect(insights.length).toBe(1);
    expect(insights[0].strength).toBe('strong');
    expect(insights[0].text).toContain('Pre-Trade Mood');
    expect(insights[0].text).toContain('positively');
  });

  it('generates insights for boolean correlations with significant P&L difference', () => {
    const boolCorr = [
      {
        field: 'fomoFlag',
        label: 'FOMO',
        trueAvgPnl: -200,
        falseAvgPnl: 300,
        trueCount: 10,
        falseCount: 40,
        pnlDifference: -500,
      },
    ];

    const insights = generateInsights([], boolCorr);
    expect(insights.length).toBe(1);
    expect(insights[0].text).toContain('FOMO');
    expect(insights[0].text).toContain('lower');
  });

  it('skips weak correlations (|r| < 0.2)', () => {
    const pairs = [
      {
        xField: 'preMood',
        xLabel: 'Mood',
        yField: 'netPnl',
        yLabel: 'P&L',
        correlation: 0.1,
        sampleSize: 10,
        dataPoints: [],
      },
    ];

    const insights = generateInsights(pairs, []);
    expect(insights.length).toBe(0);
  });

  it('sorts insights by strength (strong first)', () => {
    const pairs = [
      { xField: 'a', xLabel: 'A', yField: 'b', yLabel: 'B', correlation: 0.25, sampleSize: 10, dataPoints: [] },
      { xField: 'c', xLabel: 'C', yField: 'd', yLabel: 'D', correlation: 0.7, sampleSize: 10, dataPoints: [] },
    ];

    const insights = generateInsights(pairs, []);
    expect(insights[0].strength).toBe('strong');
    expect(insights[1].strength).toBe('weak');
  });
});

// ────────────────────────────────────────────────────────
// getCorrelationData (integration with mocked getTrades)
// ────────────────────────────────────────────────────────
describe('getCorrelationData', () => {
  it('returns empty data when no trades', async () => {
    mockGetTrades.mockResolvedValue([]);
    const data = await getCorrelationData();
    expect(data.pairs).toEqual([]);
    expect(data.booleanCorrelations).toEqual([]);
    expect(data.insights).toEqual([]);
  });

  it('returns correlation data for trades with psychology fields', async () => {
    mockGetTrades.mockResolvedValue([
      makeClosedTrade({ id: 't1', preMood: 3, fomoFlag: true, netPnl: -500, pnlPercent: -5, rMultiple: -1 }),
      makeClosedTrade({ id: 't2', preMood: 5, fomoFlag: false, netPnl: 200, pnlPercent: 2, rMultiple: 0.5 }),
      makeClosedTrade({ id: 't3', preMood: 8, fomoFlag: false, netPnl: 1000, pnlPercent: 10, rMultiple: 2 }),
      makeClosedTrade({ id: 't4', preMood: 9, fomoFlag: false, netPnl: 1500, pnlPercent: 15, rMultiple: 3 }),
    ]);

    const data = await getCorrelationData();
    expect(data.pairs.length).toBeGreaterThan(0);
    expect(data.booleanCorrelations.length).toBeGreaterThan(0);
  });
});
