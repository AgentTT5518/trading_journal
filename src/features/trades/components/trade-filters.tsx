'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import type { TradeWithCalculations } from '../types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'partial', label: 'Partial' },
] as const;

const ASSET_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'stock', label: 'Stock' },
  { value: 'option', label: 'Option' },
  { value: 'crypto', label: 'Crypto' },
] as const;

type TradeFiltersProps = {
  trades: TradeWithCalculations[];
  onFilter: (filtered: TradeWithCalculations[]) => void;
};

export function TradeFilters({ trades, onFilter }: TradeFiltersProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');

  function applyFilters(newSearch: string, newStatus: string, newAsset: string) {
    let filtered = trades;

    if (newSearch.trim()) {
      const q = newSearch.trim().toLowerCase();
      filtered = filtered.filter((t) =>
        t.ticker.toLowerCase().includes(q),
      );
    }

    if (newStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === newStatus);
    }

    if (newAsset !== 'all') {
      filtered = filtered.filter((t) => t.assetClass === newAsset);
    }

    onFilter(filtered);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    applyFilters(value, statusFilter, assetFilter);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    applyFilters(search, value, assetFilter);
  }

  function handleAssetChange(value: string) {
    setAssetFilter(value);
    applyFilters(search, statusFilter, value);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ticker..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-9 w-48 pl-8"
        />
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Status:</span>
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-7 px-2.5 text-xs',
              statusFilter === opt.value && 'pointer-events-none',
            )}
            onClick={() => handleStatusChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Asset:</span>
        {ASSET_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={assetFilter === opt.value ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-7 px-2.5 text-xs',
              assetFilter === opt.value && 'pointer-events-none',
            )}
            onClick={() => handleAssetChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
