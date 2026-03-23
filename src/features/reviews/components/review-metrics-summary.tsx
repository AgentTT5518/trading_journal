import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/shared/utils/formatting';
import type { ReviewMetrics } from '../types';

interface ReviewMetricsSummaryProps {
  metrics: ReviewMetrics;
}

export function ReviewMetricsSummary({ metrics }: ReviewMetricsSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Trades</p>
          <p className="text-2xl font-bold">{metrics.tradeCount}</p>
          <p className="text-xs text-muted-foreground">
            {metrics.winCount}W / {metrics.lossCount}L
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold">
            {metrics.winRate !== null ? `${metrics.winRate}%` : '—'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total P&L</p>
          <p className={`text-2xl font-bold ${metrics.totalPnl > 0 ? 'text-green-600' : metrics.totalPnl < 0 ? 'text-red-600' : ''}`}>
            {formatCurrency(metrics.totalPnl)}
          </p>
          {metrics.avgPnl !== null && (
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(metrics.avgPnl)}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Best / Worst</p>
          <p className="text-sm">
            {metrics.bestPnl !== null ? (
              <span className="text-green-600">{formatCurrency(metrics.bestPnl)}</span>
            ) : '—'}
            {' / '}
            {metrics.worstPnl !== null ? (
              <span className="text-red-600">{formatCurrency(metrics.worstPnl)}</span>
            ) : '—'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Profit Factor</p>
          <p className="text-2xl font-bold">
            {metrics.profitFactor !== null ? metrics.profitFactor.toFixed(2) : '—'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
