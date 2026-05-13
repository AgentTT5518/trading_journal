'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ALL_FILTER,
  filterJournalEntries,
  isReverseDateRange,
} from '../filters';
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
  const [category, setCategory] = useState<string>(ALL_FILTER);
  const [mood, setMood] = useState<string>(ALL_FILTER);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const reverseDates = isReverseDateRange(dateFrom, dateTo);

  const filtered = useMemo(
    () => filterJournalEntries(entries, { category, mood, dateFrom, dateTo, search }),
    [entries, category, mood, dateFrom, dateTo, search],
  );

  const hasActiveFilter =
    category !== ALL_FILTER ||
    mood !== ALL_FILTER ||
    dateFrom !== '' ||
    dateTo !== '' ||
    search !== '';

  const resetFilters = () => {
    setCategory(ALL_FILTER);
    setMood(ALL_FILTER);
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No journal entries yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="journal-filter-category" className="text-xs text-muted-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? ALL_FILTER)}>
              <SelectTrigger id="journal-filter-category" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All categories</SelectItem>
                <SelectItem value="pre_market">Pre-Market</SelectItem>
                <SelectItem value="post_market">Post-Market</SelectItem>
                <SelectItem value="intraday">Intraday</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="lesson">Lesson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="journal-filter-mood" className="text-xs text-muted-foreground">
              Mood
            </Label>
            <Select value={mood} onValueChange={(v) => setMood(v ?? ALL_FILTER)}>
              <SelectTrigger id="journal-filter-mood" className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All moods</SelectItem>
                <SelectItem value="1">😞 1</SelectItem>
                <SelectItem value="2">😕 2</SelectItem>
                <SelectItem value="3">😐 3</SelectItem>
                <SelectItem value="4">🙂 4</SelectItem>
                <SelectItem value="5">😄 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="journal-filter-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="journal-filter-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="journal-filter-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="journal-filter-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px]"
            />
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <Label htmlFor="journal-filter-search" className="text-xs text-muted-foreground">
              Search
            </Label>
            <Input
              id="journal-filter-search"
              type="search"
              placeholder="Search title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {hasActiveFilter && (
            <Button variant="ghost" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>
        {reverseDates && (
          <p className="mt-2 text-xs text-destructive">
            End date must be on or after start date.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No entries match your filters.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
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
      )}
    </div>
  );
}
