import { getHeatmapData } from '@/features/analytics/services/queries';
import { getMoodHeatmapData } from '@/features/dashboard/services/queries';
import { PnlCalendarHeatmap } from '@/features/analytics/components/pnl-calendar-heatmap';
import { MoodHeatmap } from '@/features/dashboard/components/mood-heatmap';
import { PageHeader } from '@/shared/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AnalyticsPage() {
  const [heatmapData, moodData] = await Promise.all([
    getHeatmapData(),
    getMoodHeatmapData(),
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
