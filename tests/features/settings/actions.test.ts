import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockInsert, mockDelete, mockUpdate } = vi.hoisted(() => {
  const chain = () => ({
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  });
  return {
    mockInsert: vi.fn().mockReturnValue(chain()),
    mockDelete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    mockUpdate: vi.fn().mockReturnValue(chain()),
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { updateSettings, clearAllTrades } from '@/features/settings/services/actions';

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeFormData(obj: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) fd.append(k, v);
  return fd;
}

const validSettings = {
  traderName: 'Alice',
  timezone: 'America/New_York',
  currency: 'USD',
  startingCapital: '',
  defaultCommission: '4.95',
  defaultRiskPercent: '1.5',
  positionSizingMethod: 'fixed-dollar',
  dateFormat: 'MM/DD/YYYY',
  theme: 'system',
};

// ─── updateSettings ───────────────────────────────────────────────────────────

describe('updateSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success for valid settings', async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    };
    mockInsert.mockReturnValue(chain);

    const result = await updateSettings({ success: false }, makeFormData(validSettings));
    expect(result.success).toBe(true);
    expect(result.message).toBe('Settings saved');
  });

  it('returns validation errors for invalid risk percent', async () => {
    const result = await updateSettings(
      { success: false },
      makeFormData({ ...validSettings, defaultRiskPercent: '0' })
    );
    expect(result.success).toBe(false);
    expect(result.errors?.defaultRiskPercent).toBeDefined();
  });

  it('returns validation errors for invalid currency', async () => {
    const result = await updateSettings(
      { success: false },
      makeFormData({ ...validSettings, currency: 'US' })
    );
    expect(result.success).toBe(false);
    expect(result.errors?.currency).toBeDefined();
  });

  it('returns error on DB failure', async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockRejectedValue(new Error('DB error')),
    };
    mockInsert.mockReturnValue(chain);

    const result = await updateSettings({ success: false }, makeFormData(validSettings));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unexpected error/i);
  });
});

// ─── clearAllTrades ───────────────────────────────────────────────────────────

describe('clearAllTrades', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes all trades when confirmation is DELETE', async () => {
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    // clearAllTrades uses db.delete(trades) without .where — mock returns value directly
    mockDelete.mockResolvedValue(undefined);

    const fd = makeFormData({ confirmation: 'DELETE' });
    const result = await clearAllTrades({ success: false }, fd);
    expect(result.success).toBe(true);
  });

  it('rejects wrong confirmation word', async () => {
    const fd = makeFormData({ confirmation: 'delete' });
    const result = await clearAllTrades({ success: false }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/DELETE/);
  });

  it('returns error on DB failure', async () => {
    mockDelete.mockRejectedValue(new Error('DB error'));
    const fd = makeFormData({ confirmation: 'DELETE' });
    const result = await clearAllTrades({ success: false }, fd);
    expect(result.success).toBe(false);
  });
});
