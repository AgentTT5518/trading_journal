'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/shared/utils/formatting';
import { cn } from '@/lib/utils';
import type { MonthlyPnlRow } from '../types';

type MonthlyPnlTableProps = {
  data: MonthlyPnlRow[];
};

export function MonthlyPnlTable({ data }: MonthlyPnlTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        No closed trades to display
      </div>
    );
  }

  const totalPnl = data.reduce((sum, r) => sum + r.netPnl, 0);
  const totalTrades = data.reduce((sum, r) => sum + r.tradeCount, 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">Trades</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="text-right">Profit Factor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.month}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell
                className={cn(
                  'text-right font-mono',
                  row.netPnl > 0 && 'text-green-600 dark:text-green-400',
                  row.netPnl < 0 && 'text-red-600 dark:text-red-400',
                )}
              >
                {formatCurrency(row.netPnl)}
              </TableCell>
              <TableCell className="text-right">{row.tradeCount}</TableCell>
              <TableCell className="text-right">{row.winRate.toFixed(0)}%</TableCell>
              <TableCell className="text-right">
                {row.profitFactor != null ? row.profitFactor.toFixed(2) : '—'}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/40 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell
              className={cn(
                'text-right font-mono',
                totalPnl > 0 && 'text-green-600 dark:text-green-400',
                totalPnl < 0 && 'text-red-600 dark:text-red-400',
              )}
            >
              {formatCurrency(totalPnl)}
            </TableCell>
            <TableCell className="text-right">{totalTrades}</TableCell>
            <TableCell className="text-right" />
            <TableCell className="text-right" />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
