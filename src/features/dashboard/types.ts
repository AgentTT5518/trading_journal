export type DashboardSummary = {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  avgRMultiple: number | null;
};

export type EquityCurvePoint = {
  date: string;
  cumulativePnl: number;
  ticker: string;
};

export type AssetClassPnl = {
  assetClass: 'stock' | 'option' | 'crypto';
  totalPnl: number;
  tradeCount: number;
};

export type WinLossData = {
  wins: number;
  losses: number;
};

export type RecentTradeRow = {
  id: string;
  ticker: string;
  assetClass: string;
  direction: string;
  exitDate: string;
  netPnl: number | null;
  pnlPercent: number | null;
};

export type RMultipleBucket = {
  range: string;
  count: number;
  isPositive: boolean;
};

export type RMultipleStats = {
  distribution: RMultipleBucket[];
  expectancy: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
  totalWithR: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  equityCurve: EquityCurvePoint[];
  assetClassBreakdown: AssetClassPnl[];
  winLoss: WinLossData;
  recentTrades: RecentTradeRow[];
  rMultipleStats: RMultipleStats;
};

export type DashboardFilterOptions = {
  from?: string;
  to?: string;
};
