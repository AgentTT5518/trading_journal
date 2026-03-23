import { cn } from '@/lib/utils';

interface AdherenceScoreBadgeProps {
  score: number;
  totalRules: number;
  rulesFollowed: number;
}

export function AdherenceScoreBadge({ score, totalRules, rulesFollowed }: AdherenceScoreBadgeProps) {
  const color =
    score >= 80
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      : score >= 50
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', color)}
      title={`${rulesFollowed}/${totalRules} rules followed`}
    >
      {score}% adherence
    </span>
  );
}
