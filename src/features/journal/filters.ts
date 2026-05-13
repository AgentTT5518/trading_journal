import type { JournalEntryWithTradeCount } from './types';

export const ALL_FILTER = 'all';

export interface JournalFilters {
  category: string;
  mood: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

/**
 * Filters journal entries client-side. All filters are AND-combined.
 * - `category` / `mood` use the sentinel value 'all' to mean "no filter"
 * - `dateFrom` / `dateTo` are inclusive ISO YYYY-MM-DD strings (empty = unbounded)
 * - `search` matches case-insensitively against title + content
 * - When a specific mood is selected, entries with null mood are excluded
 */
export function filterJournalEntries(
  entries: JournalEntryWithTradeCount[],
  filters: JournalFilters,
): JournalEntryWithTradeCount[] {
  const query = filters.search.trim().toLowerCase();
  return entries.filter((entry) => {
    if (filters.category !== ALL_FILTER && entry.category !== filters.category) return false;
    if (filters.mood !== ALL_FILTER) {
      if (entry.mood === null || entry.mood === undefined) return false;
      if (String(entry.mood) !== filters.mood) return false;
    }
    if (filters.dateFrom && entry.date < filters.dateFrom) return false;
    if (filters.dateTo && entry.date > filters.dateTo) return false;
    if (query) {
      const haystack = `${entry.title ?? ''} ${entry.content ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function isReverseDateRange(dateFrom: string, dateTo: string): boolean {
  return Boolean(dateFrom && dateTo && dateFrom > dateTo);
}
