import { describe, it, expect } from 'vitest';
import { reviewInsertSchema } from '@/features/reviews/validations';

describe('reviewInsertSchema', () => {
  const validReview = {
    type: 'weekly',
    startDate: '2026-03-01',
    endDate: '2026-03-07',
  };

  it('validates a minimal valid review', () => {
    const result = reviewInsertSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it('validates a full review with all fields', () => {
    const result = reviewInsertSchema.safeParse({
      ...validReview,
      grade: 'A',
      notes: 'Good week',
      lessonsLearned: 'Patience pays',
      goalsForNext: 'More discipline',
      rulesFollowed: JSON.stringify(['Cut losses early']),
      rulesBroken: JSON.stringify(['Overtraded']),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rulesFollowed).toEqual(['Cut losses early']);
      expect(result.data.rulesBroken).toEqual(['Overtraded']);
    }
  });

  // Type validation
  it('accepts daily type', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, type: 'daily' });
    expect(result.success).toBe(true);
  });

  it('accepts weekly type', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, type: 'weekly' });
    expect(result.success).toBe(true);
  });

  it('accepts monthly type', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, type: 'monthly' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, type: 'yearly' });
    expect(result.success).toBe(false);
  });

  // Required fields
  it('fails when type is missing', () => {
    const { type: _type, ...rest } = validReview;
    const result = reviewInsertSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when startDate is empty', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, startDate: '' });
    expect(result.success).toBe(false);
  });

  it('fails when endDate is empty', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, endDate: '' });
    expect(result.success).toBe(false);
  });

  // Grade enum
  it('accepts all valid grades', () => {
    for (const grade of ['A', 'B', 'C', 'D', 'F']) {
      const result = reviewInsertSchema.safeParse({ ...validReview, grade });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid grade', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, grade: 'E' });
    expect(result.success).toBe(false);
  });

  it('allows null grade', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, grade: null });
    expect(result.success).toBe(true);
  });

  // JSON rules parsing
  it('parses empty string rules as empty array', () => {
    const result = reviewInsertSchema.safeParse({ ...validReview, rulesFollowed: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rulesFollowed).toEqual([]);
    }
  });

  it('parses valid JSON array for rules', () => {
    const result = reviewInsertSchema.safeParse({
      ...validReview,
      rulesFollowed: JSON.stringify(['Rule 1', 'Rule 2']),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rulesFollowed).toEqual(['Rule 1', 'Rule 2']);
    }
  });

  it('handles invalid JSON in rules gracefully', () => {
    const result = reviewInsertSchema.safeParse({
      ...validReview,
      rulesFollowed: 'not valid json',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rulesFollowed).toEqual([]);
    }
  });

  // Optional fields
  it('allows undefined optional fields', () => {
    const result = reviewInsertSchema.safeParse(validReview);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grade).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });
});
