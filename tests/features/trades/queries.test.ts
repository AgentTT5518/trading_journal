/**
 * Integration tests for trade query functions.
 * The DB is mocked — no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Trade, ExitLeg } from '@/features/trades/types';

// ─── Shared row factory ───────────────────────────────────────────────────────
function makeRow(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 'row-id-1',
    assetClass: 'stock',
    ticker: 'TSLA',
    direction: 'long',
    entryDate: '2026-01-10T09:30',
    entryPrice: 200,
    positionSize: 50,
    orderType: 'limit',
    entryTrigger: null,
    exitDate: '2026-01-15T15:00',
    exitPrice: 220,
    exitReason: 'target_hit',
    plannedStopLoss: null,
    actualStopLoss: null,
    plannedTarget1: null,
    plannedTarget2: null,
    plannedTarget3: null,
    riskRewardPlanned: null,
    commissions: 2,
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
    createdAt: '2026-01-10T09:30:00.000Z',
    updatedAt: '2026-01-10T09:30:00.000Z',
    ...overrides,
  } as Trade;
}

function makeExitLeg(overrides: Partial<ExitLeg> = {}): ExitLeg {
  return {
    id: 'leg-id-1',
    tradeId: 'row-id-1',
    exitDate: '2026-01-15T15:00:00.000Z',
    exitPrice: 220,
    quantity: 25,
    exitReason: null,
    fees: 0,
    notes: null,
    createdAt: '2026-01-15T15:00:00.000Z',
    ...overrides,
  };
}

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockFindMany, mockFindFirst } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      trades: {
        findMany: mockFindMany,
        findFirst: mockFindFirst,
      },
    },
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────
import { getTrades, getTradeById } from '@/features/trades/services/queries';

// ─── getTrades ────────────────────────────────────────────────────────────────
describe('getTrades', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when there are no trades', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await getTrades();
    expect(result).toEqual([]);
  });

  it('enriches trades with computed P&L', async () => {
    mockFindMany.mockResolvedValue([{ ...makeRow(), exitLegs: [] }]);
    const result = await getTrades();

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('closed');
    // (220 - 200) * 50 = 1000 gross; net = 1000 - 2 = 998
    expect(result[0].grossPnl).toBe(1000);
    expect(result[0].netPnl).toBe(998);
  });

  it('marks trades without exit as open with null P&L', async () => {
    mockFindMany.mockResolvedValue([{ ...makeRow({ exitDate: null, exitPrice: null }), exitLegs: [] }]);
    const result = await getTrades();

    expect(result[0].status).toBe('open');
    expect(result[0].grossPnl).toBeNull();
    expect(result[0].netPnl).toBeNull();
  });

  it('enriches multiple trades independently', async () => {
    mockFindMany.mockResolvedValue([
      { ...makeRow({ id: 'r1', ticker: 'AAPL' }), exitLegs: [] },
      { ...makeRow({ id: 'r2', ticker: 'TSLA', exitDate: null, exitPrice: null }), exitLegs: [] },
    ]);
    const result = await getTrades();

    expect(result).toHaveLength(2);
    expect(result[0].ticker).toBe('AAPL');
    expect(result[0].status).toBe('closed');
    expect(result[1].ticker).toBe('TSLA');
    expect(result[1].status).toBe('open');
  });

  it('throws when DB query fails', async () => {
    mockFindMany.mockRejectedValue(new Error('DB read error'));
    await expect(getTrades()).rejects.toThrow('DB read error');
  });

  it('derives partial status from exit legs', async () => {
    const leg = makeExitLeg({ quantity: 25 }); // 25 of 50 exited
    mockFindMany.mockResolvedValue([{ ...makeRow({ exitDate: null, exitPrice: null }), exitLegs: [leg] }]);
    const result = await getTrades();

    expect(result[0].status).toBe('partial');
    expect(result[0].totalExitedQuantity).toBe(25);
  });
});

// ─── getTradeById ─────────────────────────────────────────────────────────────
describe('getTradeById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when trade is not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await getTradeById('nonexistent');
    expect(result).toBeNull();
  });

  it('returns enriched trade when found', async () => {
    mockFindFirst.mockResolvedValue({ ...makeRow({ id: 'found-id' }), exitLegs: [] });
    const result = await getTradeById('found-id');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('found-id');
    expect(result!.netPnl).toBe(998);
    expect(result!.holdingDays).toBe(6);
    expect(result!.exitLegs).toEqual([]);
  });

  it('returns open trade with null P&L fields', async () => {
    mockFindFirst.mockResolvedValue({ ...makeRow({ id: 'open-id', exitDate: null, exitPrice: null }), exitLegs: [] });
    const result = await getTradeById('open-id');

    expect(result!.status).toBe('open');
    expect(result!.grossPnl).toBeNull();
    expect(result!.pnlPercent).toBeNull();
  });

  it('throws when DB query fails', async () => {
    mockFindFirst.mockRejectedValue(new Error('DB read error'));
    await expect(getTradeById('any-id')).rejects.toThrow('DB read error');
  });

  it('enriches trade with exit legs and shows closed status', async () => {
    const legs = [
      makeExitLeg({ quantity: 30, exitPrice: 215 }),
      makeExitLeg({ id: 'leg-id-2', quantity: 20, exitPrice: 225 }),
    ];
    mockFindFirst.mockResolvedValue({ ...makeRow({ exitDate: null, exitPrice: null }), exitLegs: legs });
    const result = await getTradeById('row-id-1');

    expect(result!.status).toBe('closed');
    expect(result!.totalExitedQuantity).toBe(50);
    expect(result!.exitLegs).toHaveLength(2);
  });
});
