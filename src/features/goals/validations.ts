import { z } from 'zod/v4';

export const goalSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  goalType: z.enum(['monthly_pnl', 'max_loss', 'trade_count', 'win_rate']),
  targetValue: z.number().positive('Target must be a positive number'),
  period: z.enum(['weekly', 'monthly']),
});

export const goalIdSchema = z.string().min(1, 'Goal ID is required');
