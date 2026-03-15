import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockFindFirst } = vi.hoisted(() => {
  const mockFindFirst = vi.fn();
  return { mockFindFirst };
});

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      settings: { findFirst: mockFindFirst },
    },
  },
}));

import { getSettings } from '@/features/settings/services/queries';

const sampleSettings = {
  id: 'default',
  traderName: 'Alice',
  timezone: 'America/New_York',
  currency: 'USD',
  startingCapital: 50000,
  defaultCommission: 4.95,
  defaultRiskPercent: 1.5,
  positionSizingMethod: 'fixed-dollar',
  dateFormat: 'MM/DD/YYYY',
  theme: 'system',
  createdAt: '2026-03-15T00:00:00.000Z',
  updatedAt: '2026-03-15T00:00:00.000Z',
};

describe('getSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the settings row when it exists', async () => {
    mockFindFirst.mockResolvedValue(sampleSettings);
    const result = await getSettings();
    expect(result.traderName).toBe('Alice');
    expect(result.currency).toBe('USD');
    expect(mockFindFirst).toHaveBeenCalledTimes(1);
  });

  it('returns hardcoded defaults when no row exists', async () => {
    mockFindFirst.mockResolvedValue(undefined);
    const result = await getSettings();
    expect(result.id).toBe('default');
    expect(result.traderName).toBe('');
    expect(result.timezone).toBe('America/New_York');
    expect(result.currency).toBe('USD');
    expect(result.defaultCommission).toBe(0);
    expect(result.startingCapital).toBeNull();
    expect(result.theme).toBe('system');
  });

  it('returns defaults when DB throws', async () => {
    mockFindFirst.mockRejectedValue(new Error('DB connection failed'));
    const result = await getSettings();
    expect(result.id).toBe('default');
    expect(result.timezone).toBe('America/New_York');
  });
});
