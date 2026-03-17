'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PositionSizeSimulator() {
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [riskPercent, setRiskPercent] = useState('');
  const [accountSize, setAccountSize] = useState('');

  const entry = parseFloat(entryPrice);
  const stop = parseFloat(stopLoss);
  const risk = parseFloat(riskPercent);
  const account = parseFloat(accountSize);

  const hasValidInputs =
    !isNaN(entry) && !isNaN(stop) && !isNaN(risk) && !isNaN(account) &&
    entry > 0 && stop > 0 && risk > 0 && account > 0 && entry !== stop;

  const riskPerShare = hasValidInputs ? Math.abs(entry - stop) : 0;
  const dollarRisk = hasValidInputs ? account * (risk / 100) : 0;
  const shares = hasValidInputs && riskPerShare > 0 ? Math.floor(dollarRisk / riskPerShare) : 0;
  const totalCost = shares * entry;
  const riskRewardDisplay = hasValidInputs ? `$${dollarRisk.toFixed(2)}` : '—';

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Position Size Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sim-accountSize">Account Size ($)</Label>
            <Input
              id="sim-accountSize"
              type="number"
              step="0.01"
              placeholder="25000"
              value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sim-riskPercent">Risk per Trade (%)</Label>
            <Input
              id="sim-riskPercent"
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              placeholder="1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sim-entryPrice">Entry Price ($)</Label>
            <Input
              id="sim-entryPrice"
              type="number"
              step="0.0001"
              placeholder="150.00"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sim-stopLoss">Stop Loss ($)</Label>
            <Input
              id="sim-stopLoss"
              type="number"
              step="0.0001"
              placeholder="145.00"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Shares to Buy</p>
              <p className="text-2xl font-bold">{hasValidInputs ? shares.toLocaleString() : '—'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Dollar Risk</p>
              <p className="text-2xl font-bold">{riskRewardDisplay}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Risk per Share</p>
              <p className="text-2xl font-bold">
                {hasValidInputs ? `$${riskPerShare.toFixed(4)}` : '—'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Position Cost</p>
              <p className="text-2xl font-bold">
                {hasValidInputs ? `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </p>
            </div>
          </div>

          {hasValidInputs && totalCost > account && (
            <p className="text-sm text-destructive">
              Position cost (${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds account size (${account.toLocaleString(undefined, { minimumFractionDigits: 2 })})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
