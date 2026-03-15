'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { JournalEntryWithTradeCount } from '../types';

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

const moodEmoji: Record<number, string> = {
  1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄',
};

interface JournalListProps {
  entries: JournalEntryWithTradeCount[];
}

export function JournalList({ entries }: JournalListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No journal entries yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Link key={entry.id} href={`/journal/${entry.id}`} className="block">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={categoryColors[entry.category] ?? ''}>
                    {categoryLabels[entry.category] ?? entry.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                  {entry.title && (
                    <span className="font-medium text-sm">{entry.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground">
                  {entry.mood !== null && entry.mood !== undefined && (
                    <span title={`Mood: ${entry.mood}/5`}>{moodEmoji[entry.mood]}</span>
                  )}
                  {entry.tradeCount > 0 && (
                    <span>{entry.tradeCount} trade{entry.tradeCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {entry.content}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
