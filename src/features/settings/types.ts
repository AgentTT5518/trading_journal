import type { InferSelectModel } from 'drizzle-orm';
import type { settings } from '@/lib/db/schema';

export type Settings = InferSelectModel<typeof settings>;

export type PositionSizingMethod = 'fixed-dollar' | 'percent-equity' | 'kelly';

export type SettingsFormInput = {
  traderName: string;
  timezone: string;
  currency: string;
  startingCapital: number | null;
  defaultCommission: number;
  defaultRiskPercent: number;
  positionSizingMethod: PositionSizingMethod;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

// Re-export from trades for convenience
export type { ActionState } from '@/features/trades/types';
