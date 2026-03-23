import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/shared/utils/formatting';
import type { TickerBreakdown } from '../types';

interface ReviewTickerBreakdownProps {
  breakdown: TickerBreakdown[];
}

export function ReviewTickerBreakdown({ breakdown }: ReviewTickerBreakdownProps) {
  if (breakdown.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L by Ticker</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead className="text-right">Trades</TableHead>
              <TableHead className="text-right">Wins</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Total P&L</TableHead>
              <TableHead className="text-right">Avg P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.map((row) => (
              <TableRow key={row.ticker}>
                <TableCell className="font-medium">{row.ticker}</TableCell>
                <TableCell className="text-right">{row.tradeCount}</TableCell>
                <TableCell className="text-right">{row.winCount}</TableCell>
                <TableCell className="text-right">{row.winRate}%</TableCell>
                <TableCell
                  className={`text-right font-mono ${row.totalPnl > 0 ? 'text-green-600' : row.totalPnl < 0 ? 'text-red-600' : ''}`}
                >
                  {formatCurrency(row.totalPnl)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${row.avgPnl > 0 ? 'text-green-600' : row.avgPnl < 0 ? 'text-red-600' : ''}`}
                >
                  {formatCurrency(row.avgPnl)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
