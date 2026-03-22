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
import type { PlaybookPerformance as PlaybookPerformanceType } from '../types';

type PlaybookPerformanceProps = {
  data: PlaybookPerformanceType[];
};

export function PlaybookPerformance({ data }: PlaybookPerformanceProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        No playbook data — link tags to playbooks and tag your trades
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Playbook</TableHead>
            <TableHead className="text-right">Trades</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="text-right">Avg P&L</TableHead>
            <TableHead className="text-right">Total P&L</TableHead>
            <TableHead className="text-right">Profit Factor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.playbookId}>
              <TableCell className="font-medium">{row.playbookName}</TableCell>
              <TableCell className="text-right">{row.tradeCount}</TableCell>
              <TableCell className="text-right">{row.winRate.toFixed(0)}%</TableCell>
              <TableCell
                className={cn(
                  'text-right font-mono',
                  row.avgPnl > 0 && 'text-green-600 dark:text-green-400',
                  row.avgPnl < 0 && 'text-red-600 dark:text-red-400',
                )}
              >
                {formatCurrency(row.avgPnl)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-mono',
                  row.totalPnl > 0 && 'text-green-600 dark:text-green-400',
                  row.totalPnl < 0 && 'text-red-600 dark:text-red-400',
                )}
              >
                {formatCurrency(row.totalPnl)}
              </TableCell>
              <TableCell className="text-right">
                {row.profitFactor != null ? row.profitFactor.toFixed(2) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
