/**
 * Integration tests for journal server actions.
 * The database and revalidatePath are mocked so no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockInsert, mockDelete, mockUpdate } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockUpdate = vi.fn();
  return { mockInsert, mockDelete, mockUpdate };
});

// ─── Module mocks ────────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
  },
}));

vi.mock('@/lib/ids', () => ({ generateId: () => 'test-entry-id' }));

// ─── Imports ─────────────────────────────────────────────────────────────────
import {
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '@/features/journal/services/actions';
import { journalInsertSchema } from '@/features/journal/validations';
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

// ─── createJournalEntry ───────────────────────────────────────────────────────
describe('createJournalEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('creates an entry with minimal valid data', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'pre_market',
      content: 'Market looks strong today.',
    });
    const result = await createJournalEntry(initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('test-entry-id');
    expect(mockInsert).toHaveBeenCalledTimes(1); // entries only, no trades
  });

  it('creates an entry with all fields', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'post_market',
      title: 'End of Day Review',
      content: 'Good trading day overall.',
      mood: '4',
      energy: '3',
      marketSentiment: 'bullish',
    });
    const result = await createJournalEntry(initialState, fd);
    expect(result.success).toBe(true);
  });

  it('creates an entry with linked trade IDs', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'post_market',
      content: 'Reviewed my trades.',
      tradeIds: ['trade-1', 'trade-2'],
    });
    const result = await createJournalEntry(initialState, fd);

    expect(result.success).toBe(true);
    // Should call insert twice: once for entry, once for journalTrades
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('fails with invalid category', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'evening_recap',
      content: 'Some content.',
    });
    const result = await createJournalEntry(initialState, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Validation failed');
  });

  it('fails when date is missing', async () => {
    const fd = makeFormData({
      date: '',
      category: 'general',
      content: 'Some content.',
    });
    const result = await createJournalEntry(initialState, fd);
    expect(result.success).toBe(false);
  });

  it('fails when content is missing', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'general',
      content: '',
    });
    const result = await createJournalEntry(initialState, fd);
    expect(result.success).toBe(false);
  });

  it('fails with invalid mood value', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'general',
      content: 'Some content.',
      mood: '6',
    });
    const result = await createJournalEntry(initialState, fd);
    expect(result.success).toBe(false);
  });

  it('returns error on database failure', async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('DB error')),
    });

    const fd = makeFormData({
      date: '2026-03-15',
      category: 'pre_market',
      content: 'Some content.',
    });
    const result = await createJournalEntry(initialState, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred');
  });
});

// ─── updateJournalEntry ───────────────────────────────────────────────────────
describe('updateJournalEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('updates an entry with valid data', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'intraday',
      content: 'Updated content.',
      mood: '3',
    });
    const result = await updateJournalEntry('entry-1', initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('entry-1');
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('re-links trade IDs on update', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'post_market',
      content: 'Updated with trades.',
      tradeIds: ['trade-3'],
    });
    const result = await updateJournalEntry('entry-1', initialState, fd);

    expect(result.success).toBe(true);
    // Should delete old links then insert new ones
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('clears trade links when no tradeIds provided', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'general',
      content: 'No trades today.',
    });
    const result = await updateJournalEntry('entry-1', initialState, fd);

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1); // still deletes old links
    expect(mockInsert).toHaveBeenCalledTimes(0); // no new inserts
  });

  it('fails with invalid data', async () => {
    const fd = makeFormData({
      date: '2026-03-15',
      category: 'invalid_cat',
      content: 'Some content.',
    });
    const result = await updateJournalEntry('entry-1', initialState, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Validation failed');
  });

  it('returns error on database failure', async () => {
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('DB error')),
      }),
    });

    const fd = makeFormData({
      date: '2026-03-15',
      category: 'general',
      content: 'Some content.',
    });
    const result = await updateJournalEntry('entry-1', initialState, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred');
  });
});

// ─── deleteJournalEntry ───────────────────────────────────────────────────────
describe('deleteJournalEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  it('deletes an entry successfully', async () => {
    const result = await deleteJournalEntry('entry-1');
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('returns error on database failure', async () => {
    mockDelete.mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const result = await deleteJournalEntry('entry-1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to delete journal entry');
  });
});

// ─── collectFieldErrors — multi-error branch ──────────────────────────────────
// Covers the else branch of `if (!fieldErrors[key]) fieldErrors[key] = []`
// by injecting two Zod issues with the same path.

describe('collectFieldErrors — multiple errors for the same field', () => {
  it('createJournalEntry accumulates multiple errors for the same field key', async () => {
    const mockResult = { success: false, error: { issues: [
      { path: ['content'], message: 'Content is required' },
      { path: ['content'], message: 'Content must be at least 10 characters' },
    ] } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(journalInsertSchema, 'safeParse').mockReturnValueOnce(mockResult as any);

    const fd = makeFormData({ date: '2026-03-15', category: 'general', content: '' });
    const result = await createJournalEntry(initialState, fd);

    spy.mockRestore();
    expect(result.success).toBe(false);
    expect(Array.isArray(result.errors?.content)).toBe(true);
    expect(result.errors?.content).toHaveLength(2);
  });
});
