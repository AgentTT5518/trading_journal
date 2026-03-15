/**
 * Integration tests for journal query functions.
 * The database is mocked so no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockSelect } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  return { mockSelect };
});

// ─── Module mocks ────────────────────────────────────────────────────────────
vi.mock('@/lib/db', () => ({
  db: { select: mockSelect },
}));

// ─── Imports ─────────────────────────────────────────────────────────────────
import {
  getJournalEntries,
  getJournalEntryById,
  getTradesForDate,
} from '@/features/journal/services/queries';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeSelectChain(returnValue: unknown, terminal: 'orderBy' | 'limit' | 'where' = 'orderBy') {
  const chain: Record<string, unknown> = {};
  const methods = ['from', 'leftJoin', 'innerJoin', 'where', 'groupBy', 'orderBy', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain[terminal] = vi.fn().mockResolvedValue(returnValue);
  return chain;
}

const sampleEntry = {
  id: 'entry-001',
  date: '2026-03-15',
  category: 'pre_market',
  title: 'Morning Prep',
  content: 'Watching NVDA for breakout.',
  mood: 4,
  energy: 5,
  marketSentiment: 'bullish',
  createdAt: '2026-03-15T08:00:00.000Z',
  updatedAt: '2026-03-15T08:00:00.000Z',
  tradeCount: 2,
};

const sampleTrade = {
  id: 'trade-001',
  ticker: 'NVDA',
  assetClass: 'stock',
  direction: 'long',
  entryDate: '2026-03-15',
  exitDate: null,
};

// ─── getJournalEntries ────────────────────────────────────────────────────────
describe('getJournalEntries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a list of journal entries with trade counts', async () => {
    const chain = makeSelectChain([sampleEntry]);
    mockSelect.mockReturnValue(chain);

    const result = await getJournalEntries();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('entry-001');
    expect(result[0].tradeCount).toBe(2);
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no entries exist', async () => {
    const chain = makeSelectChain([]);
    mockSelect.mockReturnValue(chain);

    const result = await getJournalEntries();
    expect(result).toEqual([]);
  });

  it('throws and logs on database failure', async () => {
    const chain: Record<string, unknown> = {};
    const methods = ['from', 'leftJoin', 'groupBy'];
    for (const m of methods) chain[m] = vi.fn().mockReturnValue(chain);
    chain['orderBy'] = vi.fn().mockRejectedValue(new Error('DB failure'));
    mockSelect.mockReturnValue(chain);

    await expect(getJournalEntries()).rejects.toThrow('DB failure');
  });
});

// ─── getJournalEntryById ──────────────────────────────────────────────────────
describe('getJournalEntryById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when entry is not found', async () => {
    const chain = makeSelectChain([], 'limit');
    mockSelect.mockReturnValue(chain);

    const result = await getJournalEntryById('missing-id');
    expect(result).toBeNull();
  });

  it('returns entry with linked trades', async () => {
    const entryChain = makeSelectChain([sampleEntry], 'limit');
    const tradeChain = makeSelectChain([
      {
        id: 'jt-001',
        journalEntryId: 'entry-001',
        tradeId: 'trade-001',
        trade: sampleTrade,
      },
    ], 'where');

    mockSelect
      .mockReturnValueOnce(entryChain)
      .mockReturnValueOnce(tradeChain);

    const result = await getJournalEntryById('entry-001');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('entry-001');
    expect(result!.journalTrades).toHaveLength(1);
    expect(result!.journalTrades[0].trade.ticker).toBe('NVDA');
  });

  it('returns entry with empty journalTrades when none linked', async () => {
    const entryChain = makeSelectChain([sampleEntry], 'limit');
    const tradeChain = makeSelectChain([], 'where');

    mockSelect
      .mockReturnValueOnce(entryChain)
      .mockReturnValueOnce(tradeChain);

    const result = await getJournalEntryById('entry-001');

    expect(result).not.toBeNull();
    expect(result!.journalTrades).toHaveLength(0);
  });

  it('throws and logs on database failure', async () => {
    const chain: Record<string, unknown> = {};
    chain['from'] = vi.fn().mockReturnValue(chain);
    chain['where'] = vi.fn().mockReturnValue(chain);
    chain['limit'] = vi.fn().mockRejectedValue(new Error('DB failure'));
    mockSelect.mockReturnValue(chain);

    await expect(getJournalEntryById('entry-001')).rejects.toThrow('DB failure');
  });
});

// ─── getTradesForDate ─────────────────────────────────────────────────────────
describe('getTradesForDate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns trades for the given date', async () => {
    const chain = makeSelectChain([sampleTrade]);
    mockSelect.mockReturnValue(chain);

    const result = await getTradesForDate('2026-03-15');

    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('NVDA');
    expect(result[0].entryDate).toBe('2026-03-15');
  });

  it('returns empty array when no trades on that date', async () => {
    const chain = makeSelectChain([]);
    mockSelect.mockReturnValue(chain);

    const result = await getTradesForDate('2026-03-15');
    expect(result).toEqual([]);
  });

  it('throws and logs on database failure', async () => {
    const chain: Record<string, unknown> = {};
    chain['from'] = vi.fn().mockReturnValue(chain);
    chain['where'] = vi.fn().mockReturnValue(chain);
    chain['orderBy'] = vi.fn().mockRejectedValue(new Error('DB failure'));
    mockSelect.mockReturnValue(chain);

    await expect(getTradesForDate('2026-03-15')).rejects.toThrow('DB failure');
  });
});
