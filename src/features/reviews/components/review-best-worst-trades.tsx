import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/shared/utils/formatting';
import type { TradeHighlight } from '../types';

interface ReviewBestWorstTradesProps {
  bestTrade: TradeHighlight;
  worstTrade: TradeHighlight;
}

function TradeHighlightCard({
  trade,
  variant,
}: {
  trade: TradeHighlight;
  variant: 'best' | 'worst';
}) {
  const isBest = variant === 'best';
  return (
    <Card className={isBest ? 'border-green-500/30' : 'border-red-500/30'}>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-1">
          {isBest ? 'Best Trade' : 'Worst Trade'}
        </p>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/trades/${trade.id}`}
            className="text-lg font-bold hover:underline"
          >
            {trade.ticker}
          </Link>
          <Badge variant="outline" className="text-xs capitalize">
            {trade.direction}
          </Badge>
        </div>
        <p
          className={`text-xl font-mono font-semibold ${isBest ? 'text-green-600' : 'text-red-600'}`}
        >
          {trade.netPnl > 0 ? '+' : ''}
          {formatCurrency(trade.netPnl)}
        </p>
      </CardContent>
    </Card>
  );
}

export function ReviewBestWorstTrades({ bestTrade, worstTrade }: ReviewBestWorstTradesProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TradeHighlightCard trade={bestTrade} variant="best" />
      <TradeHighlightCard trade={worstTrade} variant="worst" />
    </div>
  );
}
