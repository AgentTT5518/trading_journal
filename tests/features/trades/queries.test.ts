/**
 * Integration tests for trade query functions.
 * The DB is mocked — no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Trade } from '@/features/trades/types';

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
    createdAt: '2026-01-10T09:30:00.000Z',
    updatedAt: '2026-01-10T09:30:00.000Z',
    ...overrides,
  } as Trade;
}

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockSelect } = vi.hoisted(() => {
  return { mockSelect: vi.fn() };
});

vi.mock('@/lib/db', () => ({
  db: { select: mockSelect },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────
import { getTrades, getTradeById } from '@/features/trades/services/queries';

// ─── Helper: build a fluent chain that resolves to `rows` ────────────────────
function mockChain(rows: Trade[], opts: { rejectAt?: 'orderBy' | 'limit' } = {}) {
  const limit = opts.rejectAt === 'limit'
    ? vi.fn().mockRejectedValue(new Error('DB read error'))
    : vi.fn().mockResolvedValue(rows);

  const where = vi.fn().mockReturnValue({ limit });

  const orderBy = opts.rejectAt === 'orderBy'
    ? vi.fn().mockRejectedValue(new Error('DB read error'))
    : vi.fn().mockResolvedValue(rows);

  const from = vi.fn().mockReturnValue({ orderBy, where });
  mockSelect.mockReturnValue({ from });
}

// ─── getTrades ────────────────────────────────────────────────────────────────
describe('getTrades', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when there are no trades', async () => {
    mockChain([]);
    const result = await getTrades();
    expect(result).toEqual([]);
  });

  it('enriches trades with computed P&L', async () => {
    mockChain([makeRow()]);
    const result = await getTrades();

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('closed');
    // (220 - 200) * 50 = 1000 gross; net = 1000 - 2 = 998
    expect(result[0].grossPnl).toBe(1000);
    expect(result[0].netPnl).toBe(998);
  });

  it('marks trades without exit as open with null P&L', async () => {
    mockChain([makeRow({ exitDate: null, exitPrice: null })]);
    const result = await getTrades();

    expect(result[0].status).toBe('open');
    expect(result[0].grossPnl).toBeNull();
    expect(result[0].netPnl).toBeNull();
  });

  it('enriches multiple trades independently', async () => {
    const rows = [
      makeRow({ id: 'r1', ticker: 'AAPL' }),
      makeRow({ id: 'r2', ticker: 'TSLA', exitDate: null, exitPrice: null }),
    ];
    mockChain(rows);
    const result = await getTrades();

    expect(result).toHaveLength(2);
    expect(result[0].ticker).toBe('AAPL');
    expect(result[0].status).toBe('closed');
    expect(result[1].ticker).toBe('TSLA');
    expect(result[1].status).toBe('open');
  });

  it('throws when DB query fails', async () => {
    mockChain([], { rejectAt: 'orderBy' });
    await expect(getTrades()).rejects.toThrow('DB read error');
  });
});

// ─── getTradeById ─────────────────────────────────────────────────────────────
describe('getTradeById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when trade is not found', async () => {
    mockChain([]);
    const result = await getTradeById('nonexistent');
    expect(result).toBeNull();
  });

  it('returns enriched trade when found', async () => {
    mockChain([makeRow({ id: 'found-id' })]);
    const result = await getTradeById('found-id');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('found-id');
    expect(result!.netPnl).toBe(998);
    expect(result!.holdingDays).toBe(6);
  });

  it('returns open trade with null P&L fields', async () => {
    mockChain([makeRow({ id: 'open-id', exitDate: null, exitPrice: null })]);
    const result = await getTradeById('open-id');

    expect(result!.status).toBe('open');
    expect(result!.grossPnl).toBeNull();
    expect(result!.pnlPercent).toBeNull();
  });

  it('throws when DB query fails', async () => {
    mockChain([], { rejectAt: 'limit' });
    await expect(getTradeById('any-id')).rejects.toThrow('DB read error');
  });
});
