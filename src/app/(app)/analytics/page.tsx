import { getHeatmapData, getAdvancedAnalyticsData } from '@/features/analytics/services/queries';
import { getMoodHeatmapData } from '@/features/dashboard/services/queries';
import { getSettings } from '@/features/settings/services/queries';
import { getAdherenceOverviewData } from '@/features/rule-adherence/services/queries';
import { getCorrelationData } from '@/features/correlation-analysis/services/queries';
import { PnlCalendarHeatmap } from '@/features/analytics/components/pnl-calendar-heatmap';
import { MoodHeatmap } from '@/features/dashboard/components/mood-heatmap';
import { MonthlyPnlTable } from '@/features/analytics/components/monthly-pnl-table';
import { DrawdownCurve } from '@/features/analytics/components/drawdown-curve';
import { RMultipleHistogram } from '@/features/analytics/components/r-multiple-histogram';
import { AnalyticsStatCards } from '@/features/analytics/components/analytics-stat-cards';
import { PlaybookPerformance } from '@/features/analytics/components/playbook-performance';
import { AdherenceOverview } from '@/features/rule-adherence/components/adherence-overview';
import { CorrelationDashboard } from '@/features/correlation-analysis/components/correlation-dashboard';
import { PageHeader } from '@/shared/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [heatmapData, moodData, analytics, settings, adherenceData, correlationData] = await Promise.all([
    getHeatmapData(),
    getMoodHeatmapData(),
    getAdvancedAnalyticsData(),
    getSettings(),
    getAdherenceOverviewData(),
    getCorrelationData(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Visual insights into your trading performance"
      />

      <Card>
        <CardHeader>
          <CardTitle>P&L Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <PnlCalendarHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      <AnalyticsStatCards
        sharpeRatio={analytics.sharpeRatio}
        sortinoRatio={analytics.sortinoRatio}
      />

      <Card>
        <CardHeader>
          <CardTitle>Monthly P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyPnlTable data={analytics.monthlyPnl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drawdown</CardTitle>
        </CardHeader>
        <CardContent>
          <DrawdownCurve data={analytics.drawdownCurve} dateFormat={settings.dateFormat} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>R-Multiple Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <RMultipleHistogram data={analytics.rMultipleBuckets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Playbook Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <PlaybookPerformance data={analytics.playbookPerformance} />
        </CardContent>
      </Card>

      {/* Rule Adherence */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          <AdherenceOverview data={adherenceData} />
        </CardContent>
      </Card>

      {/* Psychology Correlations */}
      <Card>
        <CardHeader>
          <CardTitle>Psychology Correlations</CardTitle>
        </CardHeader>
        <CardContent>
          <CorrelationDashboard data={correlationData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mood Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodHeatmap data={moodData} />
        </CardContent>
      </Card>
    </div>
  );
}
