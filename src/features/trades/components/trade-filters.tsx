'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
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

export type TagInfo = {
  id: string;
  name: string;
  category: string;
};

type TradeFiltersProps = {
  trades: TradeWithCalculations[];
  onFilter: (filtered: TradeWithCalculations[]) => void;
  tags?: TagInfo[];
  /** Map of tradeId → tagId[] */
  tradeTagMap?: Record<string, string[]>;
};

export function TradeFilters({ trades, onFilter, tags, tradeTagMap }: TradeFiltersProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  function applyFilters(newSearch: string, newStatus: string, newAsset: string, newTags: string[]) {
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

    if (newTags.length > 0 && tradeTagMap) {
      filtered = filtered.filter((t) => {
        const tradeTags = tradeTagMap[t.id] ?? [];
        return newTags.some((tagId) => tradeTags.includes(tagId));
      });
    }

    onFilter(filtered);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    applyFilters(value, statusFilter, assetFilter, selectedTags);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    applyFilters(search, value, assetFilter, selectedTags);
  }

  function handleAssetChange(value: string) {
    setAssetFilter(value);
    applyFilters(search, statusFilter, value, selectedTags);
  }

  function handleTagToggle(tagId: string) {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(next);
    applyFilters(search, statusFilter, assetFilter, next);
  }

  function handleClearTags() {
    setSelectedTags([]);
    applyFilters(search, statusFilter, assetFilter, []);
  }

  // Group tags by category for display
  const tagsByCategory = tags
    ? tags.reduce<Record<string, TagInfo[]>>((acc, tag) => {
        if (!acc[tag.category]) acc[tag.category] = [];
        acc[tag.category].push(tag);
        return acc;
      }, {})
    : {};

  const categoryLabels: Record<string, string> = {
    strategy: 'Strategy',
    market_condition: 'Market',
    timeframe: 'Timeframe',
    instrument: 'Instrument',
    execution: 'Execution',
    mistake: 'Mistake',
  };

  const hasTags = tags && tags.length > 0;

  return (
    <div className="space-y-3">
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

        {hasTags && (
          <div className="relative">
            <Button
              variant={selectedTags.length > 0 ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            >
              Tags{selectedTags.length > 0 && ` (${selectedTags.length})`}
            </Button>
            {tagDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setTagDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 z-20 mt-1 w-64 max-h-72 overflow-y-auto rounded-md border bg-popover p-2 shadow-md">
                  {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
                    <div key={category} className="mb-2 last:mb-0">
                      <div className="px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {categoryLabels[category] ?? category}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {categoryTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs border transition-colors',
                              selectedTags.includes(tag.id)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/50 text-foreground border-border hover:bg-muted',
                            )}
                            onClick={() => handleTagToggle(tag.id)}
                          >
                            {tag.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {selectedTags.length > 0 && tags && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {tag.name}
                <button
                  type="button"
                  className="hover:text-primary/70"
                  onClick={() => handleTagToggle(tagId)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClearTags}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
