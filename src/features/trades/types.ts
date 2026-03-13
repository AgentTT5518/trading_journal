import type { InferSelectModel } from 'drizzle-orm';
import type { trades, exitLegs } from '@/lib/db/schema';

export type Trade = InferSelectModel<typeof trades>;
export type ExitLeg = InferSelectModel<typeof exitLegs>;

export type TradeWithCalculations = Trade & {
  grossPnl: number | null;
  netPnl: number | null;
  pnlPercent: number | null;
  rMultiple: number | null;
  holdingDays: number | null;
  dte: number | null;
  status: 'open' | 'partial' | 'closed';
  exitLegs: ExitLeg[];
  totalExitedQuantity: number;
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
  | 'contracts'
  | 'status'
  | 'netPnl'
  | 'pnlPercent'
  | 'tradeGrade'
  | 'spreadId'
  | 'spreadType'
> & { exitLegCount: number };

export type ActionState<T = void> = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};
