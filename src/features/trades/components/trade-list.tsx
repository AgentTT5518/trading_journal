'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PnlBadge } from '@/shared/components/pnl-badge';
import { formatDate, formatPrice } from '@/shared/utils/formatting';
import type { TradeWithCalculations } from '../types';
import { cn } from '@/lib/utils';

// Asset class short labels
const assetClassBadge: Record<string, { label: string; className: string }> = {
  stock: { label: 'STK', className: 'border-blue-500/50 text-blue-700 dark:text-blue-400' },
  option: { label: 'OPT', className: 'border-purple-500/50 text-purple-700 dark:text-purple-400' },
  crypto: { label: 'CRY', className: 'border-orange-500/50 text-orange-700 dark:text-orange-400' },
};

function StatusBadge({ status }: { status: 'open' | 'partial' | 'closed' }) {
  if (status === 'open') return <Badge variant="secondary">Open</Badge>;
  if (status === 'partial')
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
        Partial
      </Badge>
    );
  return <Badge variant="outline">Closed</Badge>;
}

function TradeRow({ trade, indent = false, dateFormat }: { trade: TradeWithCalculations; indent?: boolean; dateFormat?: string }) {
  const ac = assetClassBadge[trade.assetClass] ?? assetClassBadge.stock;
  return (
    <TableRow className="cursor-pointer">
      <TableCell>
        <div className={cn('flex items-center gap-2', indent && 'pl-4')}>
          {indent && <span className="text-muted-foreground">└</span>}
          <Link href={`/trades/${trade.id}`} className="font-medium hover:underline">
            {trade.ticker}
            {trade.assetClass === 'option' && trade.strike != null && (
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                {trade.optionType?.toUpperCase()} {trade.strike}
              </span>
            )}
          </Link>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={cn('text-xs', ac.className)}>
            {ac.label}
          </Badge>
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
        </div>
      </TableCell>
      <TableCell>{formatDate(trade.entryDate, dateFormat)}</TableCell>
      <TableCell className="text-right font-mono">{formatPrice(trade.entryPrice)}</TableCell>
      <TableCell className="text-right font-mono">{formatPrice(trade.exitPrice)}</TableCell>
      <TableCell className="text-right">
        <PnlBadge value={trade.netPnl} />
      </TableCell>
      <TableCell>
        <StatusBadge status={trade.status} />
      </TableCell>
    </TableRow>
  );
}

export function TradeList({ trades, dateFormat }: { trades: TradeWithCalculations[]; dateFormat?: string }) {
  // Partition into ungrouped trades and spread groups
  const spreadGroups = new Map<string, TradeWithCalculations[]>();
  const ungrouped: TradeWithCalculations[] = [];

  for (const trade of trades) {
    if (trade.spreadId) {
      const existing = spreadGroups.get(trade.spreadId) ?? [];
      existing.push(trade);
      spreadGroups.set(trade.spreadId, existing);
    } else {
      ungrouped.push(trade);
    }
  }

  // Merge ungrouped and spread group entries preserving order by earliest entryDate in group
  type ListEntry =
    | { type: 'trade'; trade: TradeWithCalculations }
    | { type: 'spread'; spreadId: string; legs: TradeWithCalculations[] };

  const entries: ListEntry[] = [];

  // Build a set of spreadIds we've already added
  const addedSpreads = new Set<string>();

  for (const trade of trades) {
    if (!trade.spreadId) {
      entries.push({ type: 'trade', trade });
    } else if (!addedSpreads.has(trade.spreadId)) {
      addedSpreads.add(trade.spreadId);
      entries.push({
        type: 'spread',
        spreadId: trade.spreadId,
        legs: spreadGroups.get(trade.spreadId)!,
      });
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Type / Dir</TableHead>
            <TableHead>Entry Date</TableHead>
            <TableHead className="text-right">Entry Price</TableHead>
            <TableHead className="text-right">Exit Price</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            if (entry.type === 'trade') {
              return <TradeRow key={entry.trade.id} trade={entry.trade} dateFormat={dateFormat} />;
            }

            // Spread group
            const { spreadId, legs } = entry;
            const spreadType = legs[0]?.spreadType?.replace(/_/g, ' ') ?? 'Spread';
            const totalPnl = legs.reduce((sum, l) => sum + (l.netPnl ?? 0), 0);
            const allClosed = legs.every((l) => l.status === 'closed');
            const anyOpen = legs.some((l) => l.status === 'open');
            const spreadStatus: 'open' | 'partial' | 'closed' = allClosed
              ? 'closed'
              : anyOpen
              ? 'open'
              : 'partial';
            const tickers = [...new Set(legs.map((l) => l.ticker))].join(', ');

            return [
              // Header row for the spread
              <TableRow key={`spread-${spreadId}`} className="bg-muted/40">
                <TableCell colSpan={5} className="py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-purple-500/50 text-purple-700 dark:text-purple-400 text-xs">
                      {spreadType}
                    </Badge>
                    <span className="text-sm font-medium">{tickers}</span>
                    <span className="text-xs text-muted-foreground">· {legs.length} legs</span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-2">
                  <PnlBadge value={totalPnl !== 0 ? totalPnl : null} />
                </TableCell>
                <TableCell className="py-2">
                  <StatusBadge status={spreadStatus} />
                </TableCell>
              </TableRow>,
              // Individual leg rows
              ...legs.map((leg) => <TradeRow key={leg.id} trade={leg} indent dateFormat={dateFormat} />),
            ];
          })}
        </TableBody>
      </Table>
    </div>
  );
}
