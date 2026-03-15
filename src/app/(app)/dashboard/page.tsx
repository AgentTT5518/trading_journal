import { getDashboardData } from '@/features/dashboard/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { LinkButton } from '@/shared/components/link-button';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { DashboardCharts } from '@/features/dashboard/components/dashboard-charts';
import { RecentTradesTable } from '@/features/dashboard/components/recent-trades-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/shared/utils/formatting';

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { summary } = data;

  const pnlTrend =
    summary.totalPnl > 0
      ? 'positive' as const
      : summary.totalPnl < 0
        ? 'negative' as const
        : 'neutral' as const;

  const winRateTrend =
    summary.winRate >= 50
      ? 'positive' as const
      : summary.winRate > 0
        ? 'negative' as const
        : 'neutral' as const;

  const rMultipleValue =
    summary.avgRMultiple != null
      ? `${summary.avgRMultiple >= 0 ? '+' : ''}${summary.avgRMultiple.toFixed(2)}R`
      : 'N/A';

  const rMultipleTrend =
    summary.avgRMultiple != null
      ? summary.avgRMultiple >= 0
        ? 'positive' as const
        : 'negative' as const
      : 'neutral' as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your trading performance at a glance"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total P&L"
          value={formatCurrency(summary.totalPnl)}
          trend={pnlTrend}
        />
        <StatCard
          title="Win Rate"
          value={summary.totalTrades > 0 ? formatPercent(summary.winRate) : '—'}
          trend={winRateTrend}
        />
        <StatCard
          title="Total Trades"
          value={String(summary.totalTrades)}
        />
        <StatCard
          title="Avg R-Multiple"
          value={rMultipleValue}
          trend={rMultipleTrend}
        />
      </div>

      {summary.totalTrades === 0 ? (
        <EmptyState
          title="No closed trades yet"
          description="Close some trades to see your performance charts"
          action={<LinkButton href="/trades/new">Log a trade</LinkButton>}
        />
      ) : (
        <>
          <DashboardCharts
            equityCurve={data.equityCurve}
            assetClassBreakdown={data.assetClassBreakdown}
            winLoss={data.winLoss}
          />

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTradesTable trades={data.recentTrades} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
