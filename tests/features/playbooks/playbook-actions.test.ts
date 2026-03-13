/**
 * Integration tests for playbook server actions.
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

vi.mock('@/lib/ids', () => ({ generateId: () => 'test-playbook-id' }));

// ─── Imports ─────────────────────────────────────────────────────────────────
import { createPlaybook, updatePlaybook, deletePlaybook } from '@/features/playbooks/services/actions';
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

// ─── createPlaybook ──────────────────────────────────────────────────────────
describe('createPlaybook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
  });

  it('creates a playbook with valid data', async () => {
    const fd = makeFormData({ name: 'Breakout Strategy', description: 'Buy breakouts' });
    const result = await createPlaybook(initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('test-playbook-id');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('returns validation error when name is empty', async () => {
    const fd = makeFormData({ name: '' });
    const result = await createPlaybook(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.name).toBeDefined();
  });

  it('links tags when tagIds are provided', async () => {
    const fd = makeFormData({ name: 'Strategy', tagIds: ['tag-1', 'tag-2'] });
    const result = await createPlaybook(initialState, fd);

    expect(result.success).toBe(true);
    // 1 insert for playbook + 2 updates for tag linking
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('creates playbook without tags when tagIds not provided', async () => {
    const fd = makeFormData({ name: 'No Tags Strategy' });
    const result = await createPlaybook(initialState, fd);

    expect(result.success).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns generic error when DB throws', async () => {
    mockInsert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const fd = makeFormData({ name: 'Test' });
    const result = await createPlaybook(initialState, fd);

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred');
  });

  it('accepts all optional fields', async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert.mockReturnValue({ values: mockValues });

    const fd = makeFormData({
      name: 'Full Strategy',
      description: 'Detailed description',
      entryRules: 'Enter on breakout',
      exitRules: 'Exit at target',
      marketConditions: 'Bull market only',
      positionSizingRules: '2% risk per trade',
    });
    const result = await createPlaybook(initialState, fd);

    expect(result.success).toBe(true);
    const insertedRow = mockValues.mock.calls[0][0];
    expect(insertedRow.name).toBe('Full Strategy');
    expect(insertedRow.description).toBe('Detailed description');
    expect(insertedRow.entryRules).toBe('Enter on breakout');
    expect(insertedRow.exitRules).toBe('Exit at target');
    expect(insertedRow.marketConditions).toBe('Bull market only');
    expect(insertedRow.positionSizingRules).toBe('2% risk per trade');
  });
});

// ─── updatePlaybook ──────────────────────────────────────────────────────────
describe('updatePlaybook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
  });

  it('updates a playbook with valid data', async () => {
    const fd = makeFormData({ name: 'Updated Strategy' });
    const result = await updatePlaybook('pb-1', initialState, fd);

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('pb-1');
  });

  it('returns validation error when name is empty', async () => {
    const fd = makeFormData({ name: '' });
    const result = await updatePlaybook('pb-1', initialState, fd);

    expect(result.success).toBe(false);
    expect(result.errors?.name).toBeDefined();
  });

  it('re-links tags on update', async () => {
    const fd = makeFormData({ name: 'Strategy', tagIds: ['tag-a'] });
    const result = await updatePlaybook('pb-1', initialState, fd);

    expect(result.success).toBe(true);
    // 1 update for playbook, 1 clear old tags, 1 set new tag
    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });

  it('returns generic error when DB throws', async () => {
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockRejectedValue(new Error('DB error')) }),
    });
    const fd = makeFormData({ name: 'Test' });
    const result = await updatePlaybook('pb-1', initialState, fd);

    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred');
  });
});

// ─── deletePlaybook ──────────────────────────────────────────────────────────
describe('deletePlaybook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  it('deletes a playbook and returns success', async () => {
    const result = await deletePlaybook('pb-xyz');

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('returns error when DB throws', async () => {
    mockDelete.mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const result = await deletePlaybook('pb-xyz');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to delete playbook');
  });
});
