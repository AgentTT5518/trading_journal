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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/shared/utils/formatting';
import type { AdherenceOverviewData, AdherenceByRuleType, RuleType } from '../types';

const ruleTypeLabels: Record<RuleType, string> = {
  entry: 'Entry',
  exit: 'Exit',
  sizing: 'Sizing',
};

const ruleTypeColors: Record<RuleType, string> = {
  entry: '#10b981',
  exit: '#ef4444',
  sizing: '#3b82f6',
};

interface AdherenceOverviewProps {
  data: AdherenceOverviewData;
}

function RuleTypeBar({ item }: { item: AdherenceByRuleType }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{ruleTypeLabels[item.ruleType]}</span>
        <span className="text-muted-foreground">
          {item.followedCount}/{item.totalChecks} ({item.rate}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${item.rate}%`,
            backgroundColor: ruleTypeColors[item.ruleType],
          }}
        />
      </div>
    </div>
  );
}

export function AdherenceOverview({ data }: AdherenceOverviewProps) {
  if (data.totalTradesScored === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rule Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No rule adherence data yet. Add structured rules to playbooks and check them off when logging trades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Average Adherence</p>
            <p className="text-2xl font-bold">
              {data.averageScore !== null ? `${data.averageScore}%` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Trades Scored</p>
            <p className="text-2xl font-bold">{data.totalTradesScored}</p>
          </CardContent>
        </Card>
      </div>

      {/* Adherence by rule type */}
      {data.byRuleType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adherence by Rule Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.byRuleType.map((item) => (
              <RuleTypeBar key={item.ruleType} item={item} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scatter plot: adherence score vs P&L */}
      {data.correlationPoints.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Adherence vs P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="score"
                  name="Adherence"
                  domain={[0, 100]}
                  label={{ value: 'Adherence Score (%)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  type="number"
                  dataKey="netPnl"
                  name="Net P&L"
                  label={{ value: 'Net P&L ($)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const point = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-popover p-2 text-xs shadow-md">
                        <p className="font-medium">{point.ticker}</p>
                        <p>Adherence: {point.score}%</p>
                        <p>P&L: {formatCurrency(point.netPnl)}</p>
                      </div>
                    );
                  }}
                />
                <Scatter data={data.correlationPoints}>
                  {data.correlationPoints.map((point, index) => (
                    <Cell
                      key={index}
                      fill={point.netPnl >= 0 ? '#10b981' : '#ef4444'}
                      fillOpacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
