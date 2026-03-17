import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mock result holder
let mockDbResult: unknown[] | Error = [];

vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => {
            if (mockDbResult instanceof Error) {
              return Promise.reject(mockDbResult);
            }
            return Promise.resolve(mockDbResult);
          },
        }),
      }),
    }),
  },
}));

// Mock getTrades (required by queries.ts import)
vi.mock('@/features/trades/services/queries', () => ({
  getTrades: vi.fn().mockResolvedValue([]),
}));

import { getMoodHeatmapData } from '@/features/dashboard/services/queries';

describe('getMoodHeatmapData', () => {
  beforeEach(() => {
    mockDbResult = [];
  });

  it('returns empty array when no journal entries exist', async () => {
    mockDbResult = [];
    const result = await getMoodHeatmapData();
    expect(result).toEqual([]);
  });

  it('returns mood data for entries with mood values', async () => {
    mockDbResult = [
      { date: '2026-03-10', mood: 4, createdAt: '2026-03-10T08:00:00Z' },
      { date: '2026-03-11', mood: 2, createdAt: '2026-03-11T08:00:00Z' },
    ];

    const result = await getMoodHeatmapData();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ date: '2026-03-10', mood: 4 });
    expect(result).toContainEqual({ date: '2026-03-11', mood: 2 });
  });

  it('takes the first (most recent) entry per day when multiple entries exist', async () => {
    // Ordered by createdAt desc, so the first entry for a date is the most recent
    mockDbResult = [
      { date: '2026-03-10', mood: 5, createdAt: '2026-03-10T18:00:00Z' },
      { date: '2026-03-10', mood: 2, createdAt: '2026-03-10T08:00:00Z' },
    ];

    const result = await getMoodHeatmapData();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: '2026-03-10', mood: 5 });
  });

  it('skips entries with null mood', async () => {
    mockDbResult = [
      { date: '2026-03-10', mood: null, createdAt: '2026-03-10T18:00:00Z' },
      { date: '2026-03-10', mood: 3, createdAt: '2026-03-10T08:00:00Z' },
      { date: '2026-03-11', mood: null, createdAt: '2026-03-11T08:00:00Z' },
    ];

    const result = await getMoodHeatmapData();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: '2026-03-10', mood: 3 });
  });

  it('throws and logs error on database failure', async () => {
    mockDbResult = new Error('DB connection failed');

    await expect(getMoodHeatmapData()).rejects.toThrow('DB connection failed');
  });
});
