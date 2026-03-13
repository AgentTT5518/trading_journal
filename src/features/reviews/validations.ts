import { z } from 'zod';

export const reviewTypes = ['daily', 'weekly', 'monthly'] as const;
export const reviewGrades = ['A', 'B', 'C', 'D', 'F'] as const;

const jsonStringArray = z.string().transform((val) => {
  if (!val) return [];
  try { return JSON.parse(val) as string[]; } catch { return []; }
}).pipe(z.array(z.string()));

export const reviewInsertSchema = z.object({
  type: z.enum(reviewTypes, { message: 'Invalid review type' }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  grade: z.enum(reviewGrades).optional().nullable(),
  notes: z.string().optional().nullable(),
  lessonsLearned: z.string().optional().nullable(),
  goalsForNext: z.string().optional().nullable(),
  rulesFollowed: jsonStringArray.optional(),
  rulesBroken: jsonStringArray.optional(),
});

export type ReviewInsert = z.infer<typeof reviewInsertSchema>;
