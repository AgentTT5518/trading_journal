'use client';

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';
import { formatCurrency, formatDate } from '@/shared/utils/formatting';
import type { EquityCurvePoint } from '../types';

type EquityCurveProps = {
  data: EquityCurvePoint[];
};

export function EquityCurve({ data }: EquityCurveProps) {
  if (data.length < 2) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Not enough data to display equity curve
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDate(v)}
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrency(v)}
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          width={80}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), 'Cumulative P&L']}
          labelFormatter={(label) => formatDate(String(label))}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            color: 'hsl(var(--card-foreground))',
          }}
        />
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="cumulativePnl"
          stroke="hsl(var(--chart-1))"
          fill="url(#pnlGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
