/**
 * Integration tests for tag server actions.
 * The database and revalidatePath are mocked so no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockInsert, mockDelete, mockTransaction } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockTransaction = vi.fn();
  return { mockInsert, mockDelete, mockTransaction };
});

// ─── Module mocks ────────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    transaction: mockTransaction,
  },
}));

vi.mock('@/lib/ids', () => ({ generateId: () => 'test-tag-id' }));

// ─── Imports ─────────────────────────────────────────────────────────────────
import { createTag, deleteTag, syncTradeTags } from '@/features/playbooks/services/actions';
import type { ActionState } from '@/features/trades/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

const initialState: ActionState<{ id: string }> = { success: false };

// ─── createTag ───────────────────────────────────────────────────────────────
describe('createTag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it('creates a tag with valid data', async () => {
    const fd = makeFormData({ name: 'breakout', category: 'strategy' });
    const result = await createTag(initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('test-tag-id');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('returns validation error when name is empty', async () => {
    const fd = makeFormData({ name: '', category: 'strategy' });
    const result = await createTag(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.name).toBeDefined();
  });

  it('returns validation error when category is invalid', async () => {
    const fd = makeFormData({ name: 'test', category: 'invalid' });
    const result = await createTag(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.category).toBeDefined();
  });

  it('marks created tags as custom', async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const fd = makeFormData({ name: 'my_tag', category: 'mistake' });
    await createTag(initialState, fd);

    const insertedRow = mockValues.mock.calls[0][0];
    expect(insertedRow.isCustom).toBe(true);
  });

  it('returns generic error when DB throws', async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const fd = makeFormData({ name: 'test', category: 'strategy' });
    const result = await createTag(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred');
  });
});

// ─── deleteTag ───────────────────────────────────────────────────────────────
describe('deleteTag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  it('deletes a tag and returns success', async () => {
    const result = await deleteTag('tag-xyz');

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('returns error when DB throws', async () => {
    mockDelete.mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const result = await deleteTag('tag-xyz');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to delete tag');
  });
});

// ─── syncTradeTags ───────────────────────────────────────────────────────────
describe('syncTradeTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls transaction with delete and insert', async () => {
    const mockTxDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    const mockTxInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({ delete: mockTxDelete, insert: mockTxInsert });
    });

    await syncTradeTags('trade-abc', ['tag-1', 'tag-2']);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockTxDelete).toHaveBeenCalledTimes(1);
    expect(mockTxInsert).toHaveBeenCalledTimes(1);
  });

  it('only deletes when tagIds is empty', async () => {
    const mockTxDelete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    const mockTxInsert = vi.fn();

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({ delete: mockTxDelete, insert: mockTxInsert });
    });

    await syncTradeTags('trade-abc', []);

    expect(mockTxDelete).toHaveBeenCalledTimes(1);
    expect(mockTxInsert).not.toHaveBeenCalled();
  });

  it('throws when transaction fails', async () => {
    mockTransaction.mockRejectedValue(new Error('TX failed'));

    await expect(syncTradeTags('trade-abc', ['tag-1'])).rejects.toThrow('TX failed');
  });
});
