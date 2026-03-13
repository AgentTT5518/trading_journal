'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PnlBadge } from '@/shared/components/pnl-badge';
import { LinkButton } from '@/shared/components/link-button';
import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatPrice,
} from '@/shared/utils/formatting';
import { deleteTrade } from '../services/actions';
import type { TradeWithCalculations } from '../types';
import { cn } from '@/lib/utils';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function TradeDetail({ trade }: { trade: TradeWithCalculations }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteTrade(trade.id);
    if (result.success) {
      toast.success('Trade deleted');
      router.push('/trades');
    } else {
      toast.error(result.message || 'Failed to delete trade');
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Trade Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Trade Info
            <Badge variant={trade.status === 'open' ? 'secondary' : 'outline'}>
              {trade.status === 'open' ? 'Open' : 'Closed'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <DetailRow label="Ticker" value={trade.ticker} />
          <DetailRow
            label="Direction"
            value={
              <Badge
                variant="outline"
                className={cn(
                  trade.direction === 'long'
                    ? 'border-green-500/50 text-green-700 dark:text-green-400'
                    : 'border-red-500/50 text-red-700 dark:text-red-400'
                )}
              >
                {trade.direction.toUpperCase()}
              </Badge>
            }
          />
          <DetailRow label="Asset Class" value={trade.assetClass} />
          <DetailRow label="Order Type" value={trade.orderType ?? '—'} />
          {trade.entryTrigger && (
            <DetailRow label="Entry Trigger" value={trade.entryTrigger} />
          )}
        </CardContent>
      </Card>

      {/* P&L Summary */}
      <Card>
        <CardHeader>
          <CardTitle>P&L Summary</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <DetailRow label="Gross P&L" value={formatCurrency(trade.grossPnl)} />
          <DetailRow
            label="Net P&L"
            value={<PnlBadge value={trade.netPnl} />}
          />
          <DetailRow label="P&L %" value={formatPercent(trade.pnlPercent)} />
          <DetailRow
            label="R-Multiple"
            value={trade.rMultiple != null ? trade.rMultiple.toFixed(2) + 'R' : '—'}
          />
          <DetailRow
            label="Holding Days"
            value={trade.holdingDays != null ? `${trade.holdingDays} days` : '—'}
          />
        </CardContent>
      </Card>

      {/* Entry / Exit */}
      <Card>
        <CardHeader>
          <CardTitle>Entry</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <DetailRow label="Date" value={formatDate(trade.entryDate)} />
          <DetailRow label="Price" value={formatPrice(trade.entryPrice)} />
          <DetailRow label="Size" value={trade.positionSize.toLocaleString()} />
          <DetailRow
            label="Notional"
            value={formatCurrency(trade.entryPrice * trade.positionSize)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exit</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <DetailRow label="Date" value={formatDate(trade.exitDate)} />
          <DetailRow label="Price" value={formatPrice(trade.exitPrice)} />
          <DetailRow label="Reason" value={trade.exitReason?.replace(/_/g, ' ') ?? '—'} />
          <DetailRow label="Commissions" value={formatCurrency(trade.commissions)} />
          <DetailRow label="Fees" value={formatCurrency(trade.fees)} />
        </CardContent>
      </Card>

      {/* Notes */}
      {trade.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{trade.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 md:col-span-2">
        <LinkButton href={`/trades/${trade.id}/edit`}>Edit Trade</LinkButton>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button variant="destructive" />}>
            Delete Trade
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete trade?</DialogTitle>
              <DialogDescription>
                This will permanently delete the {trade.ticker}{' '}
                {trade.direction} trade. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
