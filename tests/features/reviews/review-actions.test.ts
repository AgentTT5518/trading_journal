/**
 * Integration tests for review server actions.
 * The database and revalidatePath are mocked so no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockInsert, mockDelete, mockUpdate, mockSelect } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockUpdate = vi.fn();
  const mockSelect = vi.fn();
  return { mockInsert, mockDelete, mockUpdate, mockSelect };
});

// ─── Module mocks ────────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
    select: mockSelect,
  },
}));

vi.mock('@/lib/ids', () => ({ generateId: () => 'test-review-id' }));

// ─── Imports ─────────────────────────────────────────────────────────────────
import { createReview, updateReview, deleteReview } from '@/features/reviews/services/actions';
import type { ActionState } from '@/features/trades/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeFormData(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) {
      for (const item of v) fd.append(k, item);
    } else {
      fd.append(k, v);
    }
  }
  return fd;
}

const initialState: ActionState<{ id: string }> = { success: false };

// ─── createReview ────────────────────────────────────────────────────────────
describe('createReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('creates a review with minimal valid data', async () => {
    const fd = makeFormData({
      type: 'weekly',
      startDate: '2026-03-01',
      endDate: '2026-03-07',
    });
    const result = await createReview(initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('test-review-id');
    expect(mockInsert).toHaveBeenCalledTimes(1); // reviews only, no trades
  });

  it('creates a review with all fields', async () => {
    const fd = makeFormData({
      type: 'daily',
      startDate: '2026-03-01',
      endDate: '2026-03-01',
      grade: 'A',
      notes: 'Good day',
      lessonsLearned: 'Be patient',
      goalsForNext: 'More discipline',
      rulesFollowed: JSON.stringify(['Rule 1']),
      rulesBroken: JSON.stringify(['Rule 2']),
    });
    const result = await createReview(initialState, fd);
    expect(result.success).toBe(true);
  });

  it('creates a review with linked trade IDs', async () => {
    const fd = makeFormData({
      type: 'weekly',
      startDate: '2026-03-01',
      endDate: '2026-03-07',
      tradeIds: ['trade-1', 'trade-2'],
    });
    const result = await createReview(initialState, fd);

    expect(result.success).toBe(true);
    // Should call insert twice: once for review, once for reviewTrades
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('fails with invalid type', async () => {
    const fd = makeFormData({
      type: 'yearly',
      startDate: '2026-03-01',
      endDate: '2026-03-07',
    });
    const result = await createReview(initialState, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Validation failed');
  });

  it('fails when startDate is missing', async () => {
    const fd = makeFormData({
      type: 'weekly',
      startDate: '',
      endDate: '2026-03-07',
    });
    const result = await createReview(initialState, fd);
    expect(result.success).toBe(false);
  });

  it('fails when endDate is missing', async () => {
    const fd = makeFormData({
      type: 'weekly',
      startDate: '2026-03-01',
      endDate: '',
    });
    const result = await createReview(initialState, fd);
    expect(result.success).toBe(false);
  });

  it('returns error on database failure', async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('DB error')),
    });

    const fd = makeFormData({
      type: 'weekly',
      startDate: '2026-03-01',
      endDate: '2026-03-07',
    });
    const result = await createReview(initialState, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred');
  });
});

// ─── updateReview ────────────────────────────────────────────────────────────
describe('updateReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('updates a review with valid data', async () => {
    const fd = makeFormData({
      type: 'monthly',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      grade: 'B',
      notes: 'Updated notes',
    });
    const result = await updateReview('review-1', initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('review-1');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('re-links trade IDs on update', async () => {
    const fd = makeFormData({
      type: 'weekly',
      startDate: '2026-03-01',
      endDate: '2026-03-07',
      tradeIds: ['trade-3'],
    });
    const result = await updateReview('review-1', initialState, fd);

    expect(result.success).toBe(true);
    // Should delete old links then insert new ones
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('fails with invalid data', async () => {
    const fd = makeFormData({
      type: 'invalid',
      startDate: '2026-03-01',
      endDate: '2026-03-07',
    });
    const result = await updateReview('review-1', initialState, fd);
    expect(result.success).toBe(false);
  });
});

// ─── deleteReview ────────────────────────────────────────────────────────────
describe('deleteReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  it('deletes a review successfully', async () => {
    const result = await deleteReview('review-1');
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('returns error on database failure', async () => {
    mockDelete.mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const result = await deleteReview('review-1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to delete review');
  });
});
