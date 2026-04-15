'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/shared/utils/formatting';
import type { ReviewWithSnapshot } from '../types';

const gradeColors: Record<string, string> = {
  A: 'border-green-500/50 text-green-700 dark:text-green-400',
  B: 'border-blue-500/50 text-blue-700 dark:text-blue-400',
  C: 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400',
  D: 'border-orange-500/50 text-orange-700 dark:text-orange-400',
  F: 'border-red-500/50 text-red-700 dark:text-red-400',
};

const typeColors: Record<string, string> = {
  daily: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  weekly: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  monthly: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

interface ReviewListProps {
  reviews: ReviewWithSnapshot[];
}

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Type</TableHead>
            <TableHead>Date Range</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead className="text-right">Trades</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => {
            const isExpanded = expandedId === review.id;
            const { snapshot } = review;
            const pnlClass =
              snapshot.totalPnl > 0
                ? 'text-green-700 dark:text-green-400'
                : snapshot.totalPnl < 0
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-muted-foreground';

            return (
              <Fragment key={review.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => toggle(review.id)}
                  data-testid={`review-row-${review.id}`}
                >
                  <TableCell className="w-10">
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Collapse review' : 'Expand review'}
                      aria-expanded={isExpanded}
                      className="flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(review.id);
                      }}
                    >
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-90',
                        )}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge className={typeColors[review.type] ?? ''}>
                      {review.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {review.startDate} — {review.endDate}
                  </TableCell>
                  <TableCell>
                    {review.grade ? (
                      <Badge variant="outline" className={cn(gradeColors[review.grade])}>
                        {review.grade}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right">{review.tradeCount}</TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <SnapshotStat
                            label="Total P&L"
                            value={formatCurrency(snapshot.totalPnl)}
                            className={pnlClass}
                          />
                          <SnapshotStat
                            label="Win Rate"
                            value={
                              snapshot.winRate != null ? `${snapshot.winRate}%` : '—'
                            }
                          />
                          <SnapshotStat
                            label="Wins / Losses"
                            value={`${snapshot.winCount} / ${snapshot.lossCount}`}
                          />
                          <SnapshotStat
                            label="Closed Trades"
                            value={`${snapshot.closedTradeCount} / ${review.tradeCount}`}
                          />
                        </div>

                        {(review.notes ||
                          review.lessonsLearned ||
                          review.goalsForNext) && (
                          <div className="grid gap-3 sm:grid-cols-3">
                            {review.notes && (
                              <SnapshotText
                                label="Notes"
                                text={truncate(review.notes)}
                              />
                            )}
                            {review.lessonsLearned && (
                              <SnapshotText
                                label="Lessons Learned"
                                text={truncate(review.lessonsLearned)}
                              />
                            )}
                            {review.goalsForNext && (
                              <SnapshotText
                                label="Goals for Next"
                                text={truncate(review.goalsForNext)}
                              />
                            )}
                          </div>
                        )}

                        <div>
                          <Link
                            href={`/reviews/${review.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View full review →
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SnapshotStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('text-lg font-semibold tabular-nums', className)}>
        {value}
      </div>
    </div>
  );
}

function SnapshotText({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <p className="text-sm whitespace-pre-wrap">{text}</p>
    </div>
  );
}
