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
import { formatCurrency } from '@/shared/utils/formatting';
import type { AssetClassPnl } from '../types';

const ASSET_CLASS_LABELS: Record<string, string> = {
  stock: 'Stock',
  option: 'Option',
  crypto: 'Crypto',
};

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
];

type AssetClassBreakdownProps = {
  data: AssetClassPnl[];
};

export function AssetClassBreakdown({ data }: AssetClassBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: ASSET_CLASS_LABELS[d.assetClass] ?? d.assetClass,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrency(v)}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          width={80}
        />
        <Tooltip
          formatter={(value, _name, entry) => [
            `${formatCurrency(Number(value))} (${(entry as { payload: { tradeCount: number } }).payload.tradeCount} trades)`,
            'P&L',
          ]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            color: 'hsl(var(--card-foreground))',
          }}
        />
        <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
