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
