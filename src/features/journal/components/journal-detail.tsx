'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteJournalEntry } from '../services/actions';
import type { JournalEntryWithTrades } from '../types';

const categoryColors: Record<string, string> = {
  pre_market: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  post_market: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  intraday: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  lesson: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const categoryLabels: Record<string, string> = {
  pre_market: 'Pre-Market',
  post_market: 'Post-Market',
  intraday: 'Intraday',
  general: 'General',
  lesson: 'Lesson',
};

const sentimentColors: Record<string, string> = {
  bullish: 'text-green-600 dark:text-green-400',
  bearish: 'text-red-600 dark:text-red-400',
  neutral: 'text-muted-foreground',
  uncertain: 'text-yellow-600 dark:text-yellow-400',
};

interface JournalDetailProps {
  entry: JournalEntryWithTrades;
}

export function JournalDetail({ entry }: JournalDetailProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Delete this journal entry?')) return;
    const result = await deleteJournalEntry(entry.id);
    if (result.success) {
      toast.success('Journal entry deleted');
      router.push('/journal');
    } else {
      toast.error(result.message ?? 'Failed to delete entry');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={categoryColors[entry.category] ?? ''}>
            {categoryLabels[entry.category] ?? entry.category}
          </Badge>
          <span className="text-sm text-muted-foreground">{entry.date}</span>
          {entry.title && (
            <span className="font-semibold">{entry.title}</span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" render={<Link href={`/journal/${entry.id}/edit`} />}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</p>
        </CardContent>
      </Card>

      {/* Psychology */}
      {(entry.mood !== null || entry.energy !== null || entry.marketSentiment !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Psychology</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              {entry.mood !== null && (
                <div>
                  <dt className="text-muted-foreground">Mood</dt>
                  <dd className="font-medium">{entry.mood} / 5</dd>
                </div>
              )}
              {entry.energy !== null && (
                <div>
                  <dt className="text-muted-foreground">Energy</dt>
                  <dd className="font-medium">{entry.energy} / 5</dd>
                </div>
              )}
              {entry.marketSentiment && (
                <div>
                  <dt className="text-muted-foreground">Market</dt>
                  <dd className={`font-medium capitalize ${sentimentColors[entry.marketSentiment] ?? ''}`}>
                    {entry.marketSentiment}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Linked Trades */}
      {entry.journalTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Trades ({entry.journalTrades.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Ticker</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Dir</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.journalTrades.map((jt) => (
                    <tr key={jt.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <Link href={`/trades/${jt.trade.id}`} className="font-medium hover:underline">
                          {jt.trade.ticker}
                        </Link>
                      </td>
                      <td className="px-3 py-2 uppercase text-muted-foreground">{jt.trade.assetClass}</td>
                      <td className="px-3 py-2 uppercase">{jt.trade.direction}</td>
                      <td className="px-3 py-2 text-muted-foreground">{jt.trade.entryDate}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {jt.trade.exitDate ? 'Closed' : 'Open'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
