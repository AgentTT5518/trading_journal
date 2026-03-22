export type DailyPnl = {
  date: string;       // YYYY-MM-DD
  netPnl: number;     // aggregated net P&L for the day
  tradeCount: number; // number of trades/legs closed on that day
};

export type CalendarDay = {
  date: string;           // YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  pnl: DailyPnl | null;  // null = no trades that day
};

export type HeatmapMonth = {
  year: number;
  month: number;   // 0-11
  label: string;   // "March 2026"
  days: CalendarDay[];
};

export type HeatmapData = {
  months: HeatmapMonth[];
  maxProfit: number;  // for color scaling
  maxLoss: number;    // for color scaling (absolute value)
};

// ─── Advanced Analytics Types ───────────────────────────────────────────────

export type MonthlyPnlRow = {
  month: string;       // "YYYY-MM"
  label: string;       // "March 2026"
  netPnl: number;
  tradeCount: number;
  winRate: number;     // 0-100
  profitFactor: number | null;
};

export type DrawdownPoint = {
  date: string;
  drawdown: number;    // negative value (peak-to-trough)
  drawdownPct: number; // as percentage of peak equity
};

export type RMultipleBucket = {
  range: string;
  count: number;
  isPositive: boolean;
};

export type PlaybookPerformance = {
  playbookId: string;
  playbookName: string;
  tradeCount: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  profitFactor: number | null;
};

export type AdvancedAnalyticsData = {
  monthlyPnl: MonthlyPnlRow[];
  drawdownCurve: DrawdownPoint[];
  rMultipleBuckets: RMultipleBucket[];
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  playbookPerformance: PlaybookPerformance[];
};
