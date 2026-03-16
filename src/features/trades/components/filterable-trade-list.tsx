'use client';

import { useState } from 'react';
import { TradeFilters } from './trade-filters';
import { TradeList } from './trade-list';
import type { TradeWithCalculations } from '../types';

type FilterableTradeListProps = {
  trades: TradeWithCalculations[];
  dateFormat?: string;
};

export function FilterableTradeList({ trades, dateFormat }: FilterableTradeListProps) {
  const [filtered, setFiltered] = useState(trades);

  return (
    <div className="space-y-4">
      <TradeFilters trades={trades} onFilter={setFiltered} />
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No trades match your filters
        </p>
      ) : (
        <TradeList trades={filtered} dateFormat={dateFormat} />
      )}
    </div>
  );
}
