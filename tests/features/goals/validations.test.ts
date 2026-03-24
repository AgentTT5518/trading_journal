import { describe, it, expect } from 'vitest';
import { goalSchema, goalIdSchema } from '@/features/goals/validations';

describe('goalSchema', () => {
  const validGoal = {
    name: 'March P&L Target',
    goalType: 'monthly_pnl',
    targetValue: 5000,
    period: 'monthly',
  };

  it('accepts valid goal data', () => {
    const result = goalSchema.safeParse(validGoal);
    expect(result.success).toBe(true);
  });

  it('accepts all goal types', () => {
    for (const goalType of ['monthly_pnl', 'max_loss', 'trade_count', 'win_rate']) {
      const result = goalSchema.safeParse({ ...validGoal, goalType });
      expect(result.success).toBe(true);
    }
  });

  it('accepts both period values', () => {
    for (const period of ['weekly', 'monthly']) {
      const result = goalSchema.safeParse({ ...validGoal, period });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty name', () => {
    const result = goalSchema.safeParse({ ...validGoal, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    const result = goalSchema.safeParse({ ...validGoal, name: 'x'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid goal type', () => {
    const result = goalSchema.safeParse({ ...validGoal, goalType: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid period', () => {
    const result = goalSchema.safeParse({ ...validGoal, period: 'yearly' });
    expect(result.success).toBe(false);
  });

  it('rejects zero target value', () => {
    const result = goalSchema.safeParse({ ...validGoal, targetValue: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative target value', () => {
    const result = goalSchema.safeParse({ ...validGoal, targetValue: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const { name: _name, ...noName } = validGoal;
    const result = goalSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it('rejects missing targetValue', () => {
    const { targetValue: _tv, ...noTarget } = validGoal;
    const result = goalSchema.safeParse(noTarget);
    expect(result.success).toBe(false);
  });
});

describe('goalIdSchema', () => {
  it('accepts valid ID string', () => {
    const result = goalIdSchema.safeParse('abc123xyz789');
    expect(result.success).toBe(true);
  });

  it('rejects empty string', () => {
    const result = goalIdSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});
