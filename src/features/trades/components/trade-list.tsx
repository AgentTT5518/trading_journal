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

export function TradeList({ trades }: { trades: TradeWithCalculations[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Entry Date</TableHead>
            <TableHead className="text-right">Entry Price</TableHead>
            <TableHead className="text-right">Exit Price</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id} className="cursor-pointer">
              <TableCell>
                <Link
                  href={`/trades/${trade.id}`}
                  className="font-medium hover:underline"
                >
                  {trade.ticker}
                </Link>
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>{formatDate(trade.entryDate)}</TableCell>
              <TableCell className="text-right font-mono">
                {formatPrice(trade.entryPrice)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatPrice(trade.exitPrice)}
              </TableCell>
              <TableCell className="text-right">
                <PnlBadge value={trade.netPnl} />
              </TableCell>
              <TableCell>
                <Badge variant={trade.status === 'open' ? 'secondary' : 'outline'}>
                  {trade.status === 'open' ? 'Open' : 'Closed'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
