import { z } from 'zod';

export const POSITION_SIZING_METHODS = ['fixed-dollar', 'percent-equity', 'kelly'] as const;
export const THEMES = ['light', 'dark', 'system'] as const;

export const settingsSchema = z.object({
  traderName: z.string().max(100, 'Name must be 100 characters or less').default(''),
  timezone: z.string().min(1, 'Timezone is required').default('America/New_York'),
  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code (e.g. USD)')
    .toUpperCase()
    .default('USD'),
  startingCapital: z
    .union([z.number().positive('Starting capital must be positive'), z.null()])
    .optional()
    .nullable()
    .default(null),
  defaultCommission: z
    .number()
    .min(0, 'Commission must be 0 or more')
    .default(0),
  defaultRiskPercent: z
    .number()
    .min(0.01, 'Risk % must be at least 0.01')
    .max(100, 'Risk % must be 100 or less')
    .default(1),
  positionSizingMethod: z.enum(POSITION_SIZING_METHODS).default('fixed-dollar'),
  dateFormat: z.string().min(1, 'Date format is required').default('MM/DD/YYYY'),
  theme: z.enum(THEMES).default('system'),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

// Schema for a single imported trade row (CSV)
export const importedTradeSchema = z.object({
  ticker: z.string().min(1, 'ticker is required'),
  assetClass: z.enum(['stock', 'option', 'crypto']),
  direction: z.enum(['long', 'short']),
  entryDate: z.string().min(1, 'entryDate is required'),
  entryPrice: z.coerce.number().positive('entryPrice must be positive'),
  positionSize: z.coerce.number().positive('positionSize must be positive'),
  exitDate: z.string().optional().nullable(),
  exitPrice: z.coerce.number().positive().optional().nullable(),
  commissions: z.coerce.number().min(0).optional().default(0),
  fees: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional().nullable(),
});

export type ImportedTradeInput = z.infer<typeof importedTradeSchema>;
