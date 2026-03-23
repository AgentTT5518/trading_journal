'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/shared/utils/formatting';
import type { CorrelationPair } from '../types';

interface CorrelationScatterProps {
  pair: CorrelationPair;
}

export function CorrelationScatter({ pair }: CorrelationScatterProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">
          {pair.xLabel} vs {pair.yLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          r = {pair.correlation.toFixed(2)} | n = {pair.sampleSize}
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name={pair.xLabel}
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            label={{ value: pair.xLabel, position: 'insideBottom', offset: -10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={pair.yLabel}
          />
          <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const point = payload[0].payload;
              return (
                <div className="rounded-md border bg-popover p-2 text-xs shadow-md">
                  <p className="font-medium">{point.ticker}</p>
                  <p>{pair.xLabel}: {point.x}</p>
                  <p>
                    {pair.yLabel}:{' '}
                    {pair.yField === 'netPnl'
                      ? formatCurrency(point.y)
                      : pair.yField === 'pnlPercent'
                        ? `${point.y.toFixed(1)}%`
                        : point.y.toFixed(2) + 'R'}
                  </p>
                </div>
              );
            }}
          />
          <Scatter data={pair.dataPoints}>
            {pair.dataPoints.map((point, index) => (
              <Cell
                key={index}
                fill={point.y >= 0 ? '#10b981' : '#ef4444'}
                fillOpacity={0.7}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
