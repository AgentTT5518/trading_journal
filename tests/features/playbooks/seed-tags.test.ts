/**
 * Tests for predefined tag seeding (idempotency + correct counts).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockInsert, mockSelect } = vi.hoisted(() => {
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  return { mockInsert, mockSelect };
});

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
  },
}));

vi.mock('@/lib/ids', () => ({ generateId: () => 'seed-id' }));

// ─── Imports ─────────────────────────────────────────────────────────────────
import { seedPredefinedTags, PREDEFINED_TAGS } from '@/features/playbooks/services/seed-tags';

describe('seedPredefinedTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts tags when no tags exist', async () => {
    // Mock select to return count = 0
    const mockFrom = vi.fn().mockResolvedValue([{ count: 0 }]);
    mockSelect.mockReturnValue({ from: mockFrom });
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });

    const result = await seedPredefinedTags();

    expect(result.skipped).toBe(false);
    const expectedCount = Object.values(PREDEFINED_TAGS).flat().length;
    expect(result.inserted).toBe(expectedCount);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('skips when tags already exist', async () => {
    const mockFrom = vi.fn().mockResolvedValue([{ count: 48 }]);
    mockSelect.mockReturnValue({ from: mockFrom });

    const result = await seedPredefinedTags();

    expect(result.skipped).toBe(true);
    expect(result.inserted).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('has the correct number of predefined tags (43)', () => {
    const totalTags = Object.values(PREDEFINED_TAGS).flat().length;
    expect(totalTags).toBe(43);
  });

  it('has all 6 categories', () => {
    const categories = Object.keys(PREDEFINED_TAGS);
    expect(categories).toEqual([
      'strategy',
      'market_condition',
      'timeframe',
      'instrument',
      'execution',
      'mistake',
    ]);
  });

  it('throws when DB insert fails', async () => {
    const mockFrom = vi.fn().mockResolvedValue([{ count: 0 }]);
    mockSelect.mockReturnValue({ from: mockFrom });
    mockInsert.mockReturnValue({ values: vi.fn().mockRejectedValue(new Error('DB error')) });

    await expect(seedPredefinedTags()).rejects.toThrow('DB error');
  });
});
