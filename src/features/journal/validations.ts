import { z } from 'zod';

export const journalCategories = [
  'pre_market',
  'post_market',
  'intraday',
  'general',
  'lesson',
] as const;

export const journalMarketSentiments = ['bullish', 'bearish', 'neutral', 'uncertain'] as const;

export const journalInsertSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  category: z.enum(journalCategories, { message: 'Invalid category' }),
  title: z.string().optional().nullable(),
  content: z.string().min(1, 'Content is required'),
  mood: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .nullable(),
  energy: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .nullable(),
  marketSentiment: z.enum(journalMarketSentiments).optional().nullable(),
  tradeIds: z.array(z.string()).optional(),
});

export type JournalInsert = z.infer<typeof journalInsertSchema>;
