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
import { cn } from '@/lib/utils';
import type { ReviewWithTradeCount } from '../types';

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
  reviews: ReviewWithTradeCount[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Date Range</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead className="text-right">Trades</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>
                <Link href={`/reviews/${review.id}`} className="hover:underline">
                  <Badge className={typeColors[review.type] ?? ''}>
                    {review.type}
                  </Badge>
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/reviews/${review.id}`} className="hover:underline">
                  {review.startDate} — {review.endDate}
                </Link>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
