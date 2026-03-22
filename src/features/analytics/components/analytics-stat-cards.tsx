'use client';

import { Card, CardContent } from '@/components/ui/card';

type StatCardProps = {
  label: string;
  value: string;
  subtitle?: string;
};

function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold font-mono">{value}</div>
        {subtitle && (
          <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}

type AnalyticsStatCardsProps = {
  sharpeRatio: number | null;
  sortinoRatio: number | null;
};

export function AnalyticsStatCards({ sharpeRatio, sortinoRatio }: AnalyticsStatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        label="Sharpe Ratio"
        value={sharpeRatio != null ? sharpeRatio.toFixed(2) : 'N/A'}
        subtitle="Return / volatility"
      />
      <StatCard
        label="Sortino Ratio"
        value={sortinoRatio != null ? sortinoRatio.toFixed(2) : 'N/A'}
        subtitle="Return / downside risk"
      />
    </div>
  );
}
