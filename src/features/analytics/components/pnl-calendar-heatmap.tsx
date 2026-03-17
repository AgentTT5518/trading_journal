'use client';

import type { HeatmapData, HeatmapMonth } from '../types';
import { PnlHeatmapCell } from './pnl-heatmap-cell';
import { PnlHeatmapLegend } from './pnl-heatmap-legend';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type MonthGridProps = {
  month: HeatmapMonth;
  maxProfit: number;
  maxLoss: number;
};

function MonthGrid({ month, maxProfit, maxLoss }: MonthGridProps) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-foreground">
        {month.label}
      </h4>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs text-muted-foreground font-medium pb-1"
          >
            {label}
          </div>
        ))}
        {month.days.map((day, idx) => (
          <PnlHeatmapCell
            key={day.isCurrentMonth ? day.date : `empty-${idx}`}
            day={day}
            maxProfit={maxProfit}
            maxLoss={maxLoss}
          />
        ))}
      </div>
    </div>
  );
}

type PnlCalendarHeatmapProps = {
  data: HeatmapData;
};

export function PnlCalendarHeatmap({ data }: PnlCalendarHeatmapProps) {
  const hasAnyTrades = data.months.some((m) =>
    m.days.some((d) => d.pnl !== null),
  );

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {data.months.map((month) => (
          <MonthGrid
            key={`${month.year}-${month.month}`}
            month={month}
            maxProfit={data.maxProfit}
            maxLoss={data.maxLoss}
          />
        ))}
      </div>

      {!hasAnyTrades && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          No closed trades in this period
        </p>
      )}

      <PnlHeatmapLegend />
    </div>
  );
}
