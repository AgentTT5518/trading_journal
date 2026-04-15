import { getDashboardData, getTopTradesData } from '@/features/dashboard/services/queries';
import { getSettings } from '@/features/settings/services/queries';
import { PageHeader } from '@/shared/components/page-header';
import { EmptyState } from '@/shared/components/empty-state';
import { LinkButton } from '@/shared/components/link-button';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { DashboardCharts } from '@/features/dashboard/components/dashboard-charts';
import { RecentTradesTable } from '@/features/dashboard/components/recent-trades-table';
import { RMultipleStatsCards } from '@/features/dashboard/components/r-multiple-stats';
import { DateRangeFilter } from '@/features/dashboard/components/date-range-filter';
import { TopTradesSection } from '@/features/dashboard/components/top-trades-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/shared/utils/formatting';

export const dynamic = 'force-dynamic';

type DashboardPageProps = {
  searchParams: Promise<{ range?: string; topRange?: string }>;
};

function getTopTradesDateRange(range?: string): { from?: string; to?: string } {
  if (!range || range === 'all') return {};
  const now = new Date();
  const to = now.toISOString();
  let days: number;
  switch (range) {
    case '30d':
      days = 30;
      break;
    case '90d':
      days = 90;
      break;
    case '180d':
      days = 180;
      break;
    default:
      return {};
  }
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to };
}

function getDateRange(range?: string): { from?: string; to?: string } {
  if (!range || range === 'all') return {};
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  switch (range) {
    case '7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'ytd':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return {};
  }
  return { from: from.toISOString(), to };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const dateRange = getDateRange(params.range);
  const topRange = params.topRange ?? 'all';
  const topDateRange = getTopTradesDateRange(topRange);
  const [data, topTrades, settings] = await Promise.all([
    getDashboardData(dateRange),
    getTopTradesData(topDateRange),
    getSettings(),
  ]);
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

  const profitFactorValue =
    summary.profitFactor != null
      ? summary.profitFactor.toFixed(2)
      : 'N/A';

  const profitFactorTrend =
    summary.profitFactor != null
      ? summary.profitFactor >= 1
        ? 'positive' as const
        : 'negative' as const
      : 'neutral' as const;

  const avgWinLossSubtitle = [
    summary.avgWin != null ? `Avg Win: ${formatCurrency(summary.avgWin)}` : null,
    summary.avgLoss != null ? `Avg Loss: ${formatCurrency(summary.avgLoss)}` : null,
  ].filter(Boolean).join(' / ') || undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          description="Your trading performance at a glance"
        />
        <DateRangeFilter activeRange={params.range ?? 'all'} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total P&L"
          value={formatCurrency(summary.totalPnl)}
          trend={pnlTrend}
        />
        <StatCard
          title="Win Rate"
          value={summary.totalTrades > 0 ? formatPercent(summary.winRate) : '—'}
          subtitle={avgWinLossSubtitle}
          trend={winRateTrend}
        />
        <StatCard
          title="Profit Factor"
          value={profitFactorValue}
          subtitle={summary.totalTrades > 0 ? `${summary.totalTrades} trades` : undefined}
          trend={profitFactorTrend}
        />
        <StatCard
          title="Avg R-Multiple"
          value={rMultipleValue}
          trend={rMultipleTrend}
        />
      </div>

      {summary.maxDrawdown > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Max Drawdown"
            value={formatCurrency(summary.maxDrawdown)}
            trend="negative"
          />
          <StatCard
            title="Total Trades"
            value={String(summary.totalTrades)}
          />
          <StatCard
            title="Avg Win / Avg Loss"
            value={
              summary.avgWin != null && summary.avgLoss != null
                ? (Math.abs(summary.avgWin / summary.avgLoss)).toFixed(2)
                : 'N/A'
            }
            subtitle="Win/Loss ratio"
            trend={
              summary.avgWin != null && summary.avgLoss != null
                ? Math.abs(summary.avgWin) > Math.abs(summary.avgLoss)
                  ? 'positive'
                  : 'negative'
                : 'neutral'
            }
          />
        </div>
      )}

      {summary.totalTrades === 0 ? (
        <EmptyState
          title="No closed trades yet"
          description="Close some trades to see your performance charts"
          action={<LinkButton href="/trades/new">Log a trade</LinkButton>}
        />
      ) : (
        <>
          {data.rMultipleStats.totalWithR > 0 && (
            <RMultipleStatsCards stats={data.rMultipleStats} />
          )}

          <DashboardCharts
            equityCurve={data.equityCurve}
            assetClassBreakdown={data.assetClassBreakdown}
            winLoss={data.winLoss}
            rMultipleDistribution={data.rMultipleStats.distribution}
            dateFormat={settings.dateFormat}
          />

          <TopTradesSection
            data={topTrades}
            activeRange={topRange}
            dateFormat={settings.dateFormat}
          />

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTradesTable trades={data.recentTrades} dateFormat={settings.dateFormat} />
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
}
