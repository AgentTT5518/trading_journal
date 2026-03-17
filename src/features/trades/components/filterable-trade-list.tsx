'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { TradeFilters } from './trade-filters';
import { TradeList } from './trade-list';
import type { TradeWithCalculations } from '../types';

type FilterableTradeListProps = {
  trades: TradeWithCalculations[];
  dateFormat?: string;
  /** YYYY-MM-DD — when set, shows a banner indicating the active date filter */
  dateFilter?: string | null;
};

function formatDateLabel(date: string): string {
  // Parse YYYY-MM-DD without timezone shift by using local date constructor
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FilterableTradeList({
  trades,
  dateFormat,
  dateFilter,
}: FilterableTradeListProps) {
  const [filtered, setFiltered] = useState(trades);

  return (
    <div className="space-y-4">
      {dateFilter && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            Showing trades closed on{' '}
            <span className="font-medium text-foreground">
              {formatDateLabel(dateFilter)}
            </span>
          </span>
          <Link
            href="/trades"
            className="ml-auto flex items-center gap-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear date filter"
          >
            <X className="h-3.5 w-3.5" />
            <span className="text-xs">Clear</span>
          </Link>
        </div>
      )}
      <TradeFilters trades={trades} onFilter={setFiltered} />
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {dateFilter
            ? 'No trades closed on this date'
            : 'No trades match your filters'}
        </p>
      ) : (
        <TradeList trades={filtered} dateFormat={dateFormat} />
      )}
    </div>
  );
}
