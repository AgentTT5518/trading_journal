'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RANGES = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All' },
] as const;

type DateRangeFilterProps = {
  activeRange: string;
};

export function DateRangeFilter({ activeRange }: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSelect(range: string) {
    const params = new URLSearchParams();
    if (range !== 'all') {
      params.set('range', range);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-1">
      {RANGES.map((range) => (
        <Button
          key={range.value}
          variant={activeRange === range.value ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-8 px-3 text-xs',
            activeRange === range.value && 'pointer-events-none',
          )}
          onClick={() => handleSelect(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
