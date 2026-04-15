'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RANGES = [
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '180d', label: '180D' },
  { value: 'all', label: 'All' },
] as const;

type TopTradesRangeFilterProps = {
  activeRange: string;
};

export function TopTradesRangeFilter({ activeRange }: TopTradesRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelect(range: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (range === 'all') {
      params.delete('topRange');
    } else {
      params.set('topRange', range);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
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
