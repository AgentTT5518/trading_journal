'use client';

import { useActionState } from 'react';
import { createTag, deleteTag } from '../services/actions';
import { TagBadge } from './tag-badge';
import { categoryLabels } from './tag-selector';
import type { TagCategory, TagWithTradeCount } from '../types';
import type { ActionState } from '@/features/trades/types';

interface TagManagerProps {
  tags: TagWithTradeCount[];
}

export function TagManager({ tags }: TagManagerProps) {
  const initialState: ActionState<{ id: string }> = { success: false };
  const [state, formAction, isPending] = useActionState(createTag, initialState);

  // Group by category
  const grouped: Record<string, TagWithTradeCount[]> = {};
  for (const tag of tags) {
    if (!grouped[tag.category]) grouped[tag.category] = [];
    grouped[tag.category].push(tag);
  }

  return (
    <div className="space-y-6">
      {/* Create custom tag form */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-medium">Create Custom Tag</h3>
        <form action={formAction} className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <label htmlFor="tag-name" className="text-xs text-muted-foreground">
              Name
            </label>
            <input
              id="tag-name"
              name="name"
              type="text"
              required
              placeholder="e.g., earnings_gap_up"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
            {state.errors?.name && (
              <p className="text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="w-40 space-y-1">
            <label htmlFor="tag-category" className="text-xs text-muted-foreground">
              Category
            </label>
            <select
              id="tag-category"
              name="category"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Adding...' : 'Add Tag'}
          </button>
        </form>
        {state.message && !state.success && (
          <p className="mt-2 text-xs text-destructive">{state.message}</p>
        )}
      </div>

      {/* Tags by category */}
      {Object.entries(grouped).map(([category, categoryTags]) => (
        <div key={category}>
          <h3 className="mb-2 text-sm font-medium">
            {categoryLabels[category as TagCategory] ?? category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-1.5"
              >
                <TagBadge name={tag.name} category={tag.category as TagCategory} />
                <span className="text-xs text-muted-foreground">
                  ({tag.tradeCount})
                </span>
                {tag.isCustom && (
                  <DeleteTagButton tagId={tag.id} tagName={tag.name} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeleteTagButton({ tagId, tagName }: { tagId: string; tagName: string }) {
  async function handleDelete() {
    if (!confirm(`Delete custom tag "${tagName}"? This will remove it from all trades.`)) return;
    await deleteTag(tagId);
  }

  return (
    <button
      onClick={handleDelete}
      className="hidden text-xs text-destructive hover:text-destructive/80 group-hover:inline"
      title="Delete custom tag"
    >
      ×
    </button>
  );
}
