import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopTradesTable } from './top-trades-table';
import { TopTradesRangeFilter } from './top-trades-range-filter';
import type { TopTradesData } from '../types';

type TopTradesSectionProps = {
  data: TopTradesData;
  activeRange: string;
  dateFormat?: string;
};

export function TopTradesSection({ data, activeRange, dateFormat }: TopTradesSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Top Trades</CardTitle>
        <TopTradesRangeFilter activeRange={activeRange} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-green-700 dark:text-green-400">
              Top 5 Winners
            </h3>
            <TopTradesTable
              trades={data.winners}
              dateFormat={dateFormat}
              emptyMessage="No winning trades in this range"
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
              Top 5 Losers
            </h3>
            <TopTradesTable
              trades={data.losers}
              dateFormat={dateFormat}
              emptyMessage="No losing trades in this range"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
