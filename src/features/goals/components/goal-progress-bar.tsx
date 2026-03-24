import { cn } from '@/lib/utils';

type GoalProgressBarProps = {
  value: number;
  max: number;
  variant: 'positive' | 'negative';
};

export function GoalProgressBar({ value, max, variant }: GoalProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          variant === 'positive'
            ? percent >= 100
              ? 'bg-green-600 dark:bg-green-500'
              : 'bg-blue-600 dark:bg-blue-500'
            : percent >= 80
              ? 'bg-red-600 dark:bg-red-500'
              : percent >= 60
                ? 'bg-amber-500 dark:bg-amber-400'
                : 'bg-green-600 dark:bg-green-500'
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
