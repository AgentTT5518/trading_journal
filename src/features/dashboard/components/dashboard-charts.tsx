'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquityCurve } from './equity-curve';
import { AssetClassBreakdown } from './asset-class-breakdown';
import { WinLossChart } from './win-loss-chart';
import type { EquityCurvePoint, AssetClassPnl, WinLossData } from '../types';

type DashboardChartsProps = {
  equityCurve: EquityCurvePoint[];
  assetClassBreakdown: AssetClassPnl[];
  winLoss: WinLossData;
};

export function DashboardCharts({
  equityCurve,
  assetClassBreakdown,
  winLoss,
}: DashboardChartsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <EquityCurve data={equityCurve} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>P&L by Asset Class</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetClassBreakdown data={assetClassBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Win / Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <WinLossChart data={winLoss} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
