'use client';

import type { MoodHeatmapDay } from '../types';

const MOOD_CONFIG: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'Very Low', bg: 'bg-red-200', text: 'text-red-800' },
  2: { label: 'Low', bg: 'bg-orange-200', text: 'text-orange-800' },
  3: { label: 'Neutral', bg: 'bg-yellow-200', text: 'text-yellow-800' },
  4: { label: 'Good', bg: 'bg-green-200', text: 'text-green-800' },
  5: { label: 'Great', bg: 'bg-emerald-300', text: 'text-emerald-800' },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatDayTooltip(year: number, month: number, day: number, mood: number | null): string {
  const dateStr = new Date(year, month, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  if (mood == null) return `${dateStr} — No mood logged`;
  const config = MOOD_CONFIG[mood];
  return `${dateStr} — Mood: ${mood} (${config?.label ?? 'Unknown'})`;
}

type MonthGridProps = {
  year: number;
  month: number;
  moodMap: Map<string, number>;
};

function MonthGrid({ year, month, moodMap }: MonthGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-foreground">
        {formatMonthYear(year, month)}
      </h4>
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs text-muted-foreground font-medium pb-1"
          >
            {label}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day == null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const mood = moodMap.get(dateKey) ?? null;
          const config = mood != null ? MOOD_CONFIG[mood] : null;

          return (
            <div
              key={dateKey}
              title={formatDayTooltip(year, month, day, mood)}
              className={`aspect-square rounded-sm flex items-center justify-center text-xs font-medium cursor-default ${
                config
                  ? `${config.bg} ${config.text}`
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {mood ?? ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type MoodHeatmapProps = {
  data: MoodHeatmapDay[];
};

export function MoodHeatmap({ data }: MoodHeatmapProps) {
  const moodMap = new Map(data.map((d) => [d.date, d.mood]));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <MonthGrid year={prevYear} month={prevMonth} moodMap={moodMap} />
        <MonthGrid year={currentYear} month={currentMonth} moodMap={moodMap} />
      </div>

      {data.length === 0 && (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          No journal entries with mood data yet
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Legend:</span>
        {Object.entries(MOOD_CONFIG).map(([value, config]) => (
          <div key={value} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-sm ${config.bg}`} />
            <span>{value} {config.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <span>No data</span>
        </div>
      </div>
    </div>
  );
}
