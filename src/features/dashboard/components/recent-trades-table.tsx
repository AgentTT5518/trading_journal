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
import { formatDate, formatPercent } from '@/shared/utils/formatting';
import type { RecentTradeRow } from '../types';

const ASSET_LABELS: Record<string, string> = {
  stock: 'STK',
  option: 'OPT',
  crypto: 'CRY',
};

type RecentTradesTableProps = {
  trades: RecentTradeRow[];
  dateFormat?: string;
};

export function RecentTradesTable({ trades, dateFormat }: RecentTradesTableProps) {
  if (trades.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground">No closed trades yet</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Direction</TableHead>
          <TableHead>Exit Date</TableHead>
          <TableHead className="text-right">P&L</TableHead>
          <TableHead className="text-right">P&L %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell>
              <Link
                href={`/trades/${trade.id}`}
                className="font-medium hover:underline"
              >
                {trade.ticker}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono text-xs">
                {ASSET_LABELS[trade.assetClass] ?? trade.assetClass}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  trade.direction === 'long'
                    ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400'
                }
              >
                {trade.direction.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(trade.exitDate, dateFormat)}</TableCell>
            <TableCell className="text-right">
              <PnlBadge value={trade.netPnl} />
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {formatPercent(trade.pnlPercent)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
