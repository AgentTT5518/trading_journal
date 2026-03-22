'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { RMultipleBucket } from '../types';

type RMultipleHistogramProps = {
  data: RMultipleBucket[];
};

export function RMultipleHistogram({ data }: RMultipleHistogramProps) {
  const hasData = data.some((b) => b.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No trades with R-multiple data (requires a stop loss to be set)
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="range"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
        />
        <YAxis
          allowDecimals={false}
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            color: 'hsl(var(--card-foreground))',
          }}
          formatter={(value) => [value, 'Trades']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.isPositive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'}
              opacity={entry.count > 0 ? 1 : 0.2}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
