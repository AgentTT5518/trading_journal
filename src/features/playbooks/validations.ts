import { z } from 'zod';

export const tagCategories = [
  'strategy',
  'market_condition',
  'timeframe',
  'instrument',
  'execution',
  'mistake',
] as const;

export const tagInsertSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(tagCategories, { message: 'Invalid category' }),
});

export type TagInsert = z.infer<typeof tagInsertSchema>;

export const playbookInsertSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional().nullable(),
  entryRules: z.string().optional().nullable(),
  exitRules: z.string().optional().nullable(),
  marketConditions: z.string().optional().nullable(),
  positionSizingRules: z.string().optional().nullable(),
});

export type PlaybookInsert = z.infer<typeof playbookInsertSchema>;
