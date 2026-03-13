/**
 * Integration tests for trade server actions.
 * The database and revalidatePath are mocked so no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks (declared before vi.mock hoisting) ────────────────────────
const { mockInsert, mockDelete, mockUpdate } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockUpdate = vi.fn();
  return { mockInsert, mockDelete, mockUpdate };
});

// ─── Module mocks ─────────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
  },
}));

vi.mock('@/lib/ids', () => ({ generateId: () => 'test-id-12' }));

// ─── Imports (after mocks) ────────────────────────────────────────────────────
import { createTrade, deleteTrade, updateTrade } from '@/features/trades/services/actions';
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

// ─── updateTrade ──────────────────────────────────────────────────────────────
describe('updateTrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
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
