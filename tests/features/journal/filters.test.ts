import { describe, it, expect } from 'vitest';
import {
  ALL_FILTER,
  filterJournalEntries,
  isReverseDateRange,
  type JournalFilters,
} from '@/features/journal/filters';
import type { JournalEntryWithTradeCount } from '@/features/journal/types';

function makeEntry(overrides: Partial<JournalEntryWithTradeCount>): JournalEntryWithTradeCount {
  return {
    id: overrides.id ?? 'id-1',
    date: overrides.date ?? '2026-03-15',
    category: overrides.category ?? 'pre_market',
    title: overrides.title ?? null,
    content: overrides.content ?? '',
    mood: overrides.mood ?? null,
    energy: overrides.energy ?? null,
    marketSentiment: overrides.marketSentiment ?? null,
    createdAt: overrides.createdAt ?? '2026-03-15T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-03-15T00:00:00.000Z',
    tradeCount: overrides.tradeCount ?? 0,
  } as JournalEntryWithTradeCount;
}

const baseFilters: JournalFilters = {
  category: ALL_FILTER,
  mood: ALL_FILTER,
  dateFrom: '',
  dateTo: '',
  search: '',
};

describe('filterJournalEntries', () => {
  const entries: JournalEntryWithTradeCount[] = [
    makeEntry({ id: 'a', date: '2026-03-10', category: 'pre_market', title: 'NVDA prep', content: 'breakout watch', mood: 4 }),
    makeEntry({ id: 'b', date: '2026-03-12', category: 'post_market', title: null, content: 'Closed flat', mood: null }),
    makeEntry({ id: 'c', date: '2026-03-15', category: 'lesson', title: 'Sizing', content: 'Position size too big on AAPL', mood: 2 }),
    makeEntry({ id: 'd', date: '2026-03-20', category: 'pre_market', title: 'TSLA plan', content: 'wait for confirmation', mood: 4 }),
  ];

  it('returns all entries when no filter is applied', () => {
    expect(filterJournalEntries(entries, baseFilters)).toHaveLength(4);
  });

  it('filters by category', () => {
    const out = filterJournalEntries(entries, { ...baseFilters, category: 'pre_market' });
    expect(out.map((e) => e.id)).toEqual(['a', 'd']);
  });

  it('filters by mood and excludes null mood when a value is selected', () => {
    const out = filterJournalEntries(entries, { ...baseFilters, mood: '4' });
    expect(out.map((e) => e.id)).toEqual(['a', 'd']);
    const nullMoodIncluded = out.some((e) => e.mood === null);
    expect(nullMoodIncluded).toBe(false);
  });

  it('includes null-mood entries when mood filter is "all"', () => {
    const out = filterJournalEntries(entries, baseFilters);
    expect(out.some((e) => e.mood === null)).toBe(true);
  });

  it('filters by inclusive dateFrom and dateTo', () => {
    const out = filterJournalEntries(entries, { ...baseFilters, dateFrom: '2026-03-12', dateTo: '2026-03-15' });
    expect(out.map((e) => e.id)).toEqual(['b', 'c']);
  });

  it('search is case-insensitive across title and content', () => {
    const out = filterJournalEntries(entries, { ...baseFilters, search: 'AAPL' });
    expect(out.map((e) => e.id)).toEqual(['c']);
    const out2 = filterJournalEntries(entries, { ...baseFilters, search: 'tsla' });
    expect(out2.map((e) => e.id)).toEqual(['d']);
  });

  it('handles null titles in search', () => {
    const out = filterJournalEntries(entries, { ...baseFilters, search: 'closed flat' });
    expect(out.map((e) => e.id)).toEqual(['b']);
  });

  it('AND-combines filters', () => {
    const out = filterJournalEntries(entries, {
      ...baseFilters,
      category: 'pre_market',
      search: 'tsla',
    });
    expect(out.map((e) => e.id)).toEqual(['d']);
  });

  it('returns empty array when a reverse date range is provided', () => {
    const out = filterJournalEntries(entries, { ...baseFilters, dateFrom: '2026-03-20', dateTo: '2026-03-10' });
    expect(out).toEqual([]);
  });
});

describe('isReverseDateRange', () => {
  it('returns false when either bound is empty', () => {
    expect(isReverseDateRange('', '')).toBe(false);
    expect(isReverseDateRange('2026-03-10', '')).toBe(false);
    expect(isReverseDateRange('', '2026-03-10')).toBe(false);
  });

  it('returns false for equal or ascending ranges', () => {
    expect(isReverseDateRange('2026-03-10', '2026-03-10')).toBe(false);
    expect(isReverseDateRange('2026-03-10', '2026-03-20')).toBe(false);
  });

  it('returns true when from > to', () => {
    expect(isReverseDateRange('2026-03-20', '2026-03-10')).toBe(true);
  });
});
