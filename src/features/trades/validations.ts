import { z } from 'zod/v4';

export const tradeInsertSchema = z.object({
  assetClass: z.enum(['stock', 'option', 'crypto']),
  ticker: z.string().min(1, 'Ticker is required').max(20).transform((v) => v.toUpperCase()),
  direction: z.enum(['long', 'short']),
  entryDate: z.string().min(1, 'Entry date is required'),
  entryPrice: z.number().positive('Entry price must be positive'),
  positionSize: z.number().positive('Position size must be positive'),
  orderType: z.enum(['market', 'limit', 'stop_limit']).optional(),
  entryTrigger: z.string().optional(),
  exitDate: z.string().optional().nullable(),
  exitPrice: z.number().positive().optional().nullable(),
  exitReason: z
    .enum(['target_hit', 'stop_hit', 'trailing_stop', 'time_based', 'discretionary', 'other'])
    .optional()
    .nullable(),
  commissions: z.number().min(0).default(0),
  fees: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export type TradeInsertInput = z.infer<typeof tradeInsertSchema>;
