import type { InferSelectModel } from 'drizzle-orm';
import type { goals } from '@/lib/db/schema';

export type Goal = InferSelectModel<typeof goals>;

export type GoalType = 'monthly_pnl' | 'max_loss' | 'trade_count' | 'win_rate';

export type GoalPeriod = 'weekly' | 'monthly';

export type GoalWithProgress = Goal & {
  currentValue: number;
  progressPercent: number;
  pacePercent: number;
  isOnTrack: boolean;
  isExceeded: boolean;
};

export type GoalActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: Goal;
};
