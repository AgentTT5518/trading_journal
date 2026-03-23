import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReviewMetricsSummary } from './review-metrics-summary';
import { ReviewBestWorstTrades } from './review-best-worst-trades';
import { ReviewTickerBreakdown } from './review-ticker-breakdown';
import { ReviewTradeSummary } from './review-trade-summary';
import type { ReviewWithMetrics } from '../types';

const gradeColors: Record<string, string> = {
  A: 'border-green-500/50 text-green-700 dark:text-green-400',
  B: 'border-blue-500/50 text-blue-700 dark:text-blue-400',
  C: 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400',
  D: 'border-orange-500/50 text-orange-700 dark:text-orange-400',
  F: 'border-red-500/50 text-red-700 dark:text-red-400',
};

function parseJsonArray(val: string | null): string[] {
  if (!val) return [];
  try { return JSON.parse(val) as string[]; } catch { return []; }
}

interface ReviewDetailProps {
  review: ReviewWithMetrics;
}

export function ReviewDetail({ review }: ReviewDetailProps) {
  const rulesFollowed = parseJsonArray(review.rulesFollowed);
  const rulesBroken = parseJsonArray(review.rulesBroken);

  return (
    <div className="space-y-6">
      {/* Period info */}
      <div className="flex items-center gap-3">
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          {review.type}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {review.startDate} — {review.endDate}
        </span>
        {review.grade && (
          <Badge variant="outline" className={cn(gradeColors[review.grade])}>
            Grade: {review.grade}
          </Badge>
        )}
      </div>

      {/* Metrics */}
      <ReviewMetricsSummary metrics={review.metrics} />

      {/* Best & Worst Trades */}
      {review.metrics.bestTrade && review.metrics.worstTrade && (
        <ReviewBestWorstTrades
          bestTrade={review.metrics.bestTrade}
          worstTrade={review.metrics.worstTrade}
        />
      )}

      {/* P&L by Ticker */}
      <ReviewTickerBreakdown breakdown={review.metrics.tickerBreakdown} />

      {/* Trade Summary Table */}
      <ReviewTradeSummary trades={review.tradeSummaries} />

      {/* Notes & Lessons */}
      <div className="grid gap-4 sm:grid-cols-2">
        {review.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{review.notes}</p>
            </CardContent>
          </Card>
        )}

        {review.lessonsLearned && (
          <Card>
            <CardHeader>
              <CardTitle>Lessons Learned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{review.lessonsLearned}</p>
            </CardContent>
          </Card>
        )}

        {review.goalsForNext && (
          <Card>
            <CardHeader>
              <CardTitle>Goals for Next Period</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{review.goalsForNext}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rules */}
      {(rulesFollowed.length > 0 || rulesBroken.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {rulesFollowed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rules Followed</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-1">
                  {rulesFollowed.map((rule, i) => (
                    <li key={i} className="text-sm text-green-700 dark:text-green-400">{rule}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {rulesBroken.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rules Broken</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-1">
                  {rulesBroken.map((rule, i) => (
                    <li key={i} className="text-sm text-red-700 dark:text-red-400">{rule}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
