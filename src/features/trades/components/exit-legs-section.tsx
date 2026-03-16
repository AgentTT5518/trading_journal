'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PnlBadge } from '@/shared/components/pnl-badge';
import { formatCurrency, formatDate, formatPrice } from '@/shared/utils/formatting';
import { deleteExitLeg } from '../services/actions';
import { getPositionMultiplier } from '../services/calculations';
import { ExitLegForm } from './exit-leg-form';
import type { TradeWithCalculations, ExitLeg } from '../types';
import { cn } from '@/lib/utils';

interface ExitLegsSectionProps {
  trade: TradeWithCalculations;
  dateFormat?: string;
}

export function ExitLegsSection({ trade, dateFormat }: ExitLegsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLeg, setEditingLeg] = useState<ExitLeg | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const multiplier = getPositionMultiplier(trade);
  const effectiveSize =
    trade.assetClass === 'option'
      ? (trade.contracts ?? trade.positionSize) * multiplier
      : trade.positionSize;
  const remaining = effectiveSize - trade.totalExitedQuantity * multiplier;
  const percentExited =
    effectiveSize > 0 ? (trade.totalExitedQuantity * multiplier) / effectiveSize : 0;

  async function handleDelete(legId: string) {
    setDeletingId(legId);
    const result = await deleteExitLeg(legId, trade.id);
    if (result.success) {
      toast.success('Exit leg deleted');
    } else {
      toast.error(result.message || 'Failed to delete exit leg');
    }
    setDeletingId(null);
  }

  function legPnl(leg: ExitLeg): number {
    const dirMul = trade.direction === 'long' ? 1 : -1;
    return (leg.exitPrice - trade.entryPrice) * leg.quantity * multiplier * dirMul - (leg.fees ?? 0);
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Exit Legs
          <Badge variant="outline" className="font-normal">
            {trade.totalExitedQuantity.toLocaleString()} /{' '}
            {(trade.assetClass === 'option' ? trade.contracts ?? trade.positionSize : trade.positionSize).toLocaleString()}{' '}
            exited
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(percentExited * 100, 100).toFixed(1)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {(percentExited * 100).toFixed(0)}% exited
            {trade.status === 'partial' && ` · ${remaining.toLocaleString()} remaining`}
          </p>
        </div>

        {/* Legs table */}
        {trade.exitLegs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Price</th>
                  <th className="pb-2 pr-4 font-medium">Qty</th>
                  <th className="pb-2 pr-4 font-medium">Fees</th>
                  <th className="pb-2 pr-4 font-medium">P&L</th>
                  <th className="pb-2 pr-4 font-medium">Reason</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {trade.exitLegs.map((leg, i) => (
                  <tr
                    key={leg.id}
                    className={cn(
                      'animate-in fade-in-0 duration-150 transition-opacity',
                      deletingId === leg.id && 'opacity-50',
                    )}
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <td className="py-2 pr-4">{formatDate(leg.exitDate, dateFormat)}</td>
                    <td className="py-2 pr-4">{formatPrice(leg.exitPrice)}</td>
                    <td className="py-2 pr-4">{leg.quantity.toLocaleString()}</td>
                    <td className="py-2 pr-4">{formatCurrency(leg.fees)}</td>
                    <td className="py-2 pr-4">
                      <PnlBadge value={legPnl(leg)} />
                    </td>
                    <td className="py-2 pr-4 capitalize">
                      {leg.exitReason?.replace(/_/g, ' ') ?? '—'}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setEditingLeg(leg);
                            setShowAddForm(false);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          disabled={deletingId === leg.id}
                          onClick={() => handleDelete(leg.id)}
                        >
                          {deletingId === leg.id ? '…' : 'Del'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit form */}
        {editingLeg && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <ExitLegForm
              tradeId={trade.id}
              remainingQty={remaining / multiplier}
              existingLeg={editingLeg}
              onDone={() => setEditingLeg(null)}
            />
          </div>
        )}

        {/* Add form */}
        {showAddForm && !editingLeg && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <ExitLegForm
              tradeId={trade.id}
              remainingQty={remaining / multiplier}
              onDone={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Add button */}
        {!showAddForm && !editingLeg && trade.status !== 'closed' && remaining > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
            + Add Exit Leg
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
