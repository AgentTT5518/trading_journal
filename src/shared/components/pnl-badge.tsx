import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/shared/utils/formatting';
import { cn } from '@/lib/utils';

export function PnlBadge({ value }: { value: number | null }) {
  if (value == null) return <Badge variant="outline">—</Badge>;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono',
        value > 0 && 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400',
        value < 0 && 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
        value === 0 && 'text-muted-foreground'
      )}
    >
      {value > 0 ? '+' : ''}
      {formatCurrency(value)}
    </Badge>
  );
}
