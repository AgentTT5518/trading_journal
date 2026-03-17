import { getHeatmapData } from '@/features/analytics/services/queries';
import { PnlCalendarHeatmap } from '@/features/analytics/components/pnl-calendar-heatmap';
import { PageHeader } from '@/shared/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AnalyticsPage() {
  // Data fetching is wrapped in getHeatmapData — errors propagate to error.tsx boundary
  const heatmapData = await getHeatmapData();

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
    </div>
  );
}
