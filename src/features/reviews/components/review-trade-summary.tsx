import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/shared/utils/formatting';
import type { TradeSummary } from '../types';

interface ReviewTradeSummaryProps {
  trades: TradeSummary[];
}

export function ReviewTradeSummary({ trades }: ReviewTradeSummaryProps) {
  if (trades.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead>Exit Date</TableHead>
              <TableHead className="text-right">P&L</TableHead>
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
                  <Badge variant="outline" className="text-xs capitalize">
                    {trade.direction}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(trade.entryDate)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {trade.exitDate ? formatDate(trade.exitDate) : 'Open'}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${trade.netPnl > 0 ? 'text-green-600' : trade.netPnl < 0 ? 'text-red-600' : ''}`}
                >
                  {trade.exitDate ? formatCurrency(trade.netPnl) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
