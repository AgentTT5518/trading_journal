'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Tag, TagCategory } from '../types';

const categoryLabels: Record<TagCategory, string> = {
  strategy: 'Strategy',
  market_condition: 'Market Condition',
  timeframe: 'Timeframe',
  instrument: 'Instrument',
  execution: 'Execution',
  mistake: 'Mistake',
};

const categoryColors: Record<TagCategory, string> = {
  strategy: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  market_condition: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  timeframe: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  instrument: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  execution: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  mistake: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

function formatTagName(name: string): string {
  return name.replace(/_/g, ' ');
}

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  name?: string;
}

export function TagSelector({
  tags,
  selectedTagIds: initialSelectedIds,
  name = 'tagIds',
}: TagSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group tags by category
  const grouped: Record<string, Tag[]> = {};
  for (const tag of tags) {
    if (!grouped[tag.category]) grouped[tag.category] = [];
    grouped[tag.category].push(tag);
  }

  function toggleTag(tagId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-3">
      {/* Hidden inputs for form submission */}
      {Array.from(selectedIds).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      {selectedCount > 0 && (
        <p className="text-xs text-muted-foreground">{selectedCount} tag{selectedCount !== 1 ? 's' : ''} selected</p>
      )}

      {Object.entries(grouped).map(([category, categoryTags]) => {
        const isExpanded = expandedCategories.has(category);
        const selectedInCategory = categoryTags.filter((t) => selectedIds.has(t.id));

        return (
          <div key={category} className="rounded-md border">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50"
            >
              <span>{categoryLabels[category as TagCategory] ?? category}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {selectedInCategory.length > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {selectedInCategory.length}
                  </span>
                )}
                <span>{isExpanded ? '−' : '+'}</span>
              </span>
            </button>

            {isExpanded && (
              <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
                {categoryTags.map((tag) => {
                  const isSelected = selectedIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                        isSelected
                          ? categoryColors[category as TagCategory]
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {formatTagName(tag.name)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { categoryColors, categoryLabels, formatTagName };
