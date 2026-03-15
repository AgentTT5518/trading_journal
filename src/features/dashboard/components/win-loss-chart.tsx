'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { WinLossData } from '../types';

const COLORS = {
  wins: 'hsl(142, 71%, 45%)',
  losses: 'hsl(0, 72%, 51%)',
};

type WinLossChartProps = {
  data: WinLossData;
};

export function WinLossChart({ data }: WinLossChartProps) {
  const total = data.wins + data.losses;
  if (total === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No data
      </div>
    );
  }

  const chartData = [
    { name: 'Wins', value: data.wins, color: COLORS.wins },
    { name: 'Losses', value: data.losses, color: COLORS.losses },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `${Number(value)} (${((Number(value) / total) * 100).toFixed(1)}%)`,
            String(name),
          ]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            color: 'hsl(var(--card-foreground))',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
