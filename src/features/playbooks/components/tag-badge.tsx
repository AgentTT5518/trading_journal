import { cn } from '@/lib/utils';
import type { TagCategory } from '../types';
import { categoryColors, formatTagName } from './tag-selector';

interface TagBadgeProps {
  name: string;
  category: TagCategory;
  className?: string;
}

export function TagBadge({ name, category, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        categoryColors[category],
        className
      )}
    >
      {formatTagName(name)}
    </span>
  );
}
