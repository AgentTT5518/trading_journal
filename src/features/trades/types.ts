import type { InferSelectModel } from 'drizzle-orm';
import type { trades } from '@/lib/db/schema';

export type Trade = InferSelectModel<typeof trades>;

export type TradeWithCalculations = Trade & {
  grossPnl: number | null;
  netPnl: number | null;
  pnlPercent: number | null;
  rMultiple: number | null;
  holdingDays: number | null;
  status: 'open' | 'closed';
};

export type TradeListItem = Pick<
  TradeWithCalculations,
  | 'id'
  | 'ticker'
  | 'assetClass'
  | 'direction'
  | 'entryDate'
  | 'exitDate'
  | 'entryPrice'
  | 'exitPrice'
  | 'positionSize'
  | 'status'
  | 'netPnl'
  | 'pnlPercent'
  | 'tradeGrade'
>;

export type ActionState<T = void> = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};
