'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CorrelationMatrix } from './correlation-matrix';
import { CorrelationScatter } from './correlation-scatter';
import { CorrelationInsights } from './correlation-insights';
import type { CorrelationData, CorrelationPair } from '../types';

interface CorrelationDashboardProps {
  data: CorrelationData;
}

export function CorrelationDashboard({ data }: CorrelationDashboardProps) {
  const [selectedPair, setSelectedPair] = useState<CorrelationPair | null>(null);

  const hasData = data.pairs.length > 0 || data.booleanCorrelations.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Psychology Correlations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No correlation data available. Log trades with psychology fields (mood, confidence, etc.) to see patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Correlation Matrix */}
      {data.pairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Correlation Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <CorrelationMatrix
              pairs={data.pairs}
              onSelectPair={setSelectedPair}
              selectedPair={selectedPair}
            />
          </CardContent>
        </Card>
      )}

      {/* Scatter Plot (shown when a cell is selected) */}
      {selectedPair && (
        <Card>
          <CardHeader>
            <CardTitle>Scatter Plot</CardTitle>
          </CardHeader>
          <CardContent>
            <CorrelationScatter pair={selectedPair} />
          </CardContent>
        </Card>
      )}

      {/* Insights + Boolean comparisons */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <CorrelationInsights
            insights={data.insights}
            booleanCorrelations={data.booleanCorrelations}
          />
        </CardContent>
      </Card>
    </div>
  );
}
