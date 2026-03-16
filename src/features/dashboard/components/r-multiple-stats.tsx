import { StatCard } from './stat-card';
import type { RMultipleStats as RMultipleStatsType } from '../types';

type RMultipleStatsProps = {
  stats: RMultipleStatsType;
};

export function RMultipleStatsCards({ stats }: RMultipleStatsProps) {
  const expectancyValue = stats.expectancy != null
    ? `${stats.expectancy >= 0 ? '+' : ''}${stats.expectancy.toFixed(2)}R`
    : 'N/A';
  const expectancyTrend = stats.expectancy != null
    ? stats.expectancy >= 0 ? 'positive' as const : 'negative' as const
    : 'neutral' as const;

  const avgWinValue = stats.avgWinR != null
    ? `+${stats.avgWinR.toFixed(2)}R`
    : 'N/A';

  const avgLossValue = stats.avgLossR != null
    ? `-${stats.avgLossR.toFixed(2)}R`
    : 'N/A';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        title="Expectancy"
        value={expectancyValue}
        trend={expectancyTrend}
      />
      <StatCard
        title="Avg Win R"
        value={avgWinValue}
        trend="positive"
      />
      <StatCard
        title="Avg Loss R"
        value={avgLossValue}
        trend="negative"
      />
    </div>
  );
}
