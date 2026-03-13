import { describe, it, expect } from 'vitest';
import { tagInsertSchema } from '@/features/playbooks/validations';

describe('tagInsertSchema', () => {
  it('validates a valid tag', () => {
    const result = tagInsertSchema.safeParse({ name: 'breakout', category: 'strategy' });
    expect(result.success).toBe(true);
  });

  it('fails when name is empty', () => {
    const result = tagInsertSchema.safeParse({ name: '', category: 'strategy' });
    expect(result.success).toBe(false);
  });

  it('fails when name is missing', () => {
    const result = tagInsertSchema.safeParse({ category: 'strategy' });
    expect(result.success).toBe(false);
  });

  it('fails when category is invalid', () => {
    const result = tagInsertSchema.safeParse({ name: 'test', category: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('fails when category is missing', () => {
    const result = tagInsertSchema.safeParse({ name: 'test' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid categories', () => {
    const categories = ['strategy', 'market_condition', 'timeframe', 'instrument', 'execution', 'mistake'];
    for (const category of categories) {
      const result = tagInsertSchema.safeParse({ name: 'test', category });
      expect(result.success).toBe(true);
    }
  });

  it('rejects name longer than 100 characters', () => {
    const result = tagInsertSchema.safeParse({
      name: 'a'.repeat(101),
      category: 'strategy',
    });
    expect(result.success).toBe(false);
  });
});
