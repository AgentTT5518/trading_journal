import type { CorrelationInsight, BooleanCorrelation } from '../types';
import { formatCurrency } from '@/shared/utils/formatting';

const strengthColors: Record<string, string> = {
  strong: 'border-l-emerald-500',
  moderate: 'border-l-amber-500',
  weak: 'border-l-muted-foreground/50',
};

interface CorrelationInsightsProps {
  insights: CorrelationInsight[];
  booleanCorrelations: BooleanCorrelation[];
}

export function CorrelationInsights({ insights, booleanCorrelations }: CorrelationInsightsProps) {
  if (insights.length === 0 && booleanCorrelations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No significant patterns found yet. Add more trades with psychology fields to surface insights.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`border-l-4 pl-3 py-1.5 text-sm ${strengthColors[insight.strength]}`}
            >
              {insight.text}
            </div>
          ))}
        </div>
      )}

      {/* Boolean flag comparison table */}
      {booleanCorrelations.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Psychology Flag Impact
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Flag</th>
                  <th className="p-2 text-right font-medium">With Flag</th>
                  <th className="p-2 text-right font-medium">Without</th>
                  <th className="p-2 text-right font-medium">Difference</th>
                </tr>
              </thead>
              <tbody>
                {booleanCorrelations.map((bc) => (
                  <tr key={bc.field} className="border-b last:border-0">
                    <td className="p-2 font-medium">
                      {bc.label}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({bc.trueCount}/{bc.falseCount})
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono">
                      {formatCurrency(bc.trueAvgPnl)}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {formatCurrency(bc.falseAvgPnl)}
                    </td>
                    <td
                      className={`p-2 text-right font-mono font-medium ${
                        bc.pnlDifference >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {bc.pnlDifference >= 0 ? '+' : ''}
                      {formatCurrency(bc.pnlDifference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
