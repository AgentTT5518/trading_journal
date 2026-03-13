/**
 * Integration tests for trade server actions.
 * The database and revalidatePath are mocked so no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks (declared before vi.mock hoisting) ────────────────────────
const { mockInsert, mockDelete, mockUpdate, mockFindFirst, mockFindMany, mockTransaction } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockUpdate = vi.fn();
  const mockFindFirst = vi.fn();
  const mockFindMany = vi.fn();
  const mockTransaction = vi.fn();
  return { mockInsert, mockDelete, mockUpdate, mockFindFirst, mockFindMany, mockTransaction };
});

// ─── Module mocks ─────────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
    transaction: mockTransaction,
    query: {
      trades: { findFirst: mockFindFirst },
      exitLegs: { findMany: mockFindMany },
    },
  },
}));

vi.mock('@/lib/ids', () => ({ generateId: () => 'test-id-12' }));

// ─── Imports (after mocks) ────────────────────────────────────────────────────
import {
  createTrade,
  deleteTrade,
  updateTrade,
  addExitLeg,
  deleteExitLeg,
} from '@/features/trades/services/actions';
import type { ActionState } from '@/features/trades/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

const validTradeFields = {
  assetClass: 'stock',
  ticker: 'AAPL',
  direction: 'long',
  entryDate: '2026-01-15T09:30',
  entryPrice: '150.00',
  positionSize: '100',
  orderType: 'limit',
  commissions: '1',
  fees: '0',
};

const initialState: ActionState<{ id: string }> = { success: false };

// ─── createTrade ──────────────────────────────────────────────────────────────
describe('createTrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('creates a trade with valid data and returns the new id', async () => {
    const fd = makeFormData(validTradeFields);
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('test-id-12');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('returns validation errors when ticker is missing', async () => {
    const fd = makeFormData({ ...validTradeFields, ticker: '' });
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.ticker).toBeDefined();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns validation errors when entryPrice is negative', async () => {
    const fd = makeFormData({ ...validTradeFields, entryPrice: '-10' });
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.entryPrice).toBeDefined();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns validation errors when positionSize is zero', async () => {
    const fd = makeFormData({ ...validTradeFields, positionSize: '0' });
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.positionSize).toBeDefined();
  });

  it('upcases the ticker on insert', async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const fd = makeFormData({ ...validTradeFields, ticker: 'aapl' });
    await createTrade(initialState, fd);

    const insertedRow = mockValues.mock.calls[0][0];
    expect(insertedRow.ticker).toBe('AAPL');
  });

  it('accepts a trade without exit fields (open position)', async () => {
    const fd = makeFormData(validTradeFields);
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(true);
  });

  it('returns generic error message when DB throws', async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('DB connection lost')),
    });
    const fd = makeFormData(validTradeFields);
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred');
  });
});

// ─── createTrade with market context ─────────────────────────────────────────
describe('createTrade — context fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('persists swing and market context fields', async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const fd = makeFormData({
      ...validTradeFields,
      plannedHoldDays: '5',
      heldOverWeekend: 'on',
      weeklyTrend: 'up',
      marketRegime: 'trending',
      vixLevel: '20.5',
      rsiAtEntry: '55',
      macdAtEntry: 'bullish crossover',
      distanceFrom50ma: '-2.5',
      volumeProfile: 'above_avg',
      atrAtEntry: '3.5',
    });
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(true);
    const row = mockValues.mock.calls[0][0];
    expect(row.plannedHoldDays).toBe(5);
    expect(row.heldOverWeekend).toBe(true);
    expect(row.weeklyTrend).toBe('up');
    expect(row.marketRegime).toBe('trending');
    expect(row.vixLevel).toBe(20.5);
    expect(row.rsiAtEntry).toBe(55);
    expect(row.macdAtEntry).toBe('bullish crossover');
    expect(row.distanceFrom50ma).toBe(-2.5);
    expect(row.volumeProfile).toBe('above_avg');
    expect(row.atrAtEntry).toBe(3.5);
  });
});

// ─── createTrade with psychology ──────────────────────────────────────────────
describe('createTrade — psychology fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('persists psychology fields when provided', async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const fd = makeFormData({
      ...validTradeFields,
      preMood: '7',
      preConfidence: '8',
      fomoFlag: 'on',
      anxietyDuring: '5',
      executionSatisfaction: '9',
      tradeGrade: 'B',
      lessonsLearned: 'Waited for confirmation',
    });
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(true);
    const row = mockValues.mock.calls[0][0];
    expect(row.preMood).toBe(7);
    expect(row.preConfidence).toBe(8);
    expect(row.fomoFlag).toBe(true);
    expect(row.anxietyDuring).toBe(5);
    expect(row.executionSatisfaction).toBe(9);
    expect(row.tradeGrade).toBe('B');
    expect(row.lessonsLearned).toBe('Waited for confirmation');
  });

  it('defaults boolean flags to false when unchecked', async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const fd = makeFormData(validTradeFields); // no fomoFlag or revengeFlag
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(true);
    const row = mockValues.mock.calls[0][0];
    expect(row.fomoFlag).toBe(false);
    expect(row.revengeFlag).toBe(false);
  });

  it('rejects invalid psychology values', async () => {
    const fd = makeFormData({
      ...validTradeFields,
      preMood: '15', // above 10
    });
    const result = await createTrade(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.preMood).toBeDefined();
  });
});

// ─── updateTrade ──────────────────────────────────────────────────────────────
describe('updateTrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });
    // syncTradeTags uses db.transaction — execute the callback with mock tx
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const mockTx = {
        delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      };
      await fn(mockTx);
    });
  });

  it('updates a trade with valid data', async () => {
    const fd = makeFormData({
      ...validTradeFields,
      exitDate: '2026-01-20T15:00',
      exitPrice: '165.00',
    });
    const result = await updateTrade('trade-abc', initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('trade-abc');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns the same id that was passed in', async () => {
    const fd = makeFormData(validTradeFields);
    const result = await updateTrade('my-special-id', initialState, fd);

    expect(result.data?.id).toBe('my-special-id');
  });

  it('returns validation errors when ticker is empty', async () => {
    const fd = makeFormData({ ...validTradeFields, ticker: '' });
    const result = await updateTrade('trade-abc', initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.ticker).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns generic error message when DB throws', async () => {
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('DB error')),
      }),
    });
    const fd = makeFormData(validTradeFields);
    const result = await updateTrade('trade-abc', initialState, fd);

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred');
  });
});

// ─── deleteTrade ──────────────────────────────────────────────────────────────
describe('deleteTrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  it('deletes a trade and returns success', async () => {
    const result = await deleteTrade('trade-xyz');

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('returns error message when DB throws', async () => {
    mockDelete.mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const result = await deleteTrade('trade-xyz');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to delete trade');
  });
});

// ─── addExitLeg ───────────────────────────────────────────────────────────────
describe('addExitLeg', () => {
  const initialLegState: ActionState<{ id: string }> = { success: false };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue({ id: 'trade-abc', positionSize: 100 });
    mockFindMany.mockResolvedValue([]);
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('adds an exit leg with valid data', async () => {
    const fd = makeFormData({
      exitDate: '2026-01-20T15:00',
      exitPrice: '160',
      quantity: '50',
    });
    const result = await addExitLeg('trade-abc', initialLegState, fd);
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('test-id-12');
  });

  it('returns validation error when exitPrice is missing', async () => {
    const fd = makeFormData({ exitDate: '2026-01-20T15:00', quantity: '50' });
    const result = await addExitLeg('trade-abc', initialLegState, fd);
    expect(result.success).toBe(false);
    expect(result.errors?.exitPrice).toBeDefined();
  });

  it('rejects quantity exceeding remaining position', async () => {
    mockFindMany.mockResolvedValue([{ quantity: 80 }]); // 80 already exited of 100
    const fd = makeFormData({
      exitDate: '2026-01-20T15:00',
      exitPrice: '160',
      quantity: '30', // only 20 remaining
    });
    const result = await addExitLeg('trade-abc', initialLegState, fd);
    expect(result.success).toBe(false);
    expect(result.errors?.quantity).toBeDefined();
  });

  it('returns error when trade is not found', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const fd = makeFormData({
      exitDate: '2026-01-20T15:00',
      exitPrice: '160',
      quantity: '50',
    });
    const result = await addExitLeg('nonexistent', initialLegState, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Trade not found');
  });
});

// ─── deleteExitLeg ────────────────────────────────────────────────────────────
describe('deleteExitLeg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  it('deletes an exit leg and returns success', async () => {
    const result = await deleteExitLeg('leg-xyz', 'trade-abc');
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('returns error when DB throws', async () => {
    mockDelete.mockReturnValue({ where: vi.fn().mockRejectedValue(new Error('DB error')) });
    const result = await deleteExitLeg('leg-xyz', 'trade-abc');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to delete exit leg');
  });
});
