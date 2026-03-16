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

type RMultipleDistributionProps = {
  data: RMultipleBucket[];
};

export function RMultipleDistribution({ data }: RMultipleDistributionProps) {
  const hasData = data.some((b) => b.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No trades with R-multiple data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="range"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          allowDecimals={false}
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
              fill={entry.isPositive
                ? 'hsl(var(--chart-2, 142 71% 45%))'
                : 'hsl(var(--chart-5, 0 84% 60%))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
