'use client';

import { cn } from '@/lib/utils';
import type { CorrelationPair } from '../types';

interface CorrelationMatrixProps {
  pairs: CorrelationPair[];
  onSelectPair: (pair: CorrelationPair) => void;
  selectedPair: CorrelationPair | null;
}

/** Color for correlation coefficient: green = positive, red = negative, intensity by magnitude */
function correlationColor(r: number): string {
  const absR = Math.abs(r);
  if (absR < 0.1) return 'bg-muted text-muted-foreground';
  if (r > 0) {
    if (absR >= 0.5) return 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300';
    if (absR >= 0.3) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-500';
  } else {
    if (absR >= 0.5) return 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300';
    if (absR >= 0.3) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-500';
  }
}

export function CorrelationMatrix({ pairs, onSelectPair, selectedPair }: CorrelationMatrixProps) {
  if (pairs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough data for correlation analysis. Need at least 3 closed trades with psychology fields filled in.
      </p>
    );
  }

  // Extract unique x-labels (psychology fields) and y-labels (P&L metrics)
  const xLabels = [...new Set(pairs.map((p) => p.xLabel))];
  const yLabels = [...new Set(pairs.map((p) => p.yLabel))];

  // Build lookup map
  const pairMap = new Map(pairs.map((p) => [`${p.xField}-${p.yField}`, p]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left text-xs font-medium text-muted-foreground" />
            {yLabels.map((label) => (
              <th key={label} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xLabels.map((xLabel) => {
            const xField = pairs.find((p) => p.xLabel === xLabel)?.xField;
            return (
              <tr key={xLabel}>
                <td className="p-2 text-xs font-medium text-muted-foreground">{xLabel}</td>
                {yLabels.map((yLabel) => {
                  const yField = pairs.find((p) => p.yLabel === yLabel)?.yField;
                  const pair = xField && yField ? pairMap.get(`${xField}-${yField}`) : undefined;
                  const isSelected =
                    selectedPair?.xField === pair?.xField &&
                    selectedPair?.yField === pair?.yField;

                  if (!pair) {
                    return (
                      <td key={yLabel} className="p-2 text-center text-xs text-muted-foreground">
                        —
                      </td>
                    );
                  }

                  return (
                    <td key={yLabel} className="p-1">
                      <button
                        type="button"
                        onClick={() => onSelectPair(pair)}
                        className={cn(
                          'w-full rounded-md px-2 py-1.5 text-center text-xs font-mono font-medium transition-all hover:ring-2 hover:ring-ring',
                          correlationColor(pair.correlation),
                          isSelected && 'ring-2 ring-ring'
                        )}
                        title={`n=${pair.sampleSize}. Click to view scatter plot.`}
                      >
                        {pair.correlation.toFixed(2)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Click a cell to view scatter plot. Green = positive correlation, Red = negative.
      </p>
    </div>
  );
}
