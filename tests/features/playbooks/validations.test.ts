import { describe, it, expect } from 'vitest';
import { tagInsertSchema, playbookInsertSchema } from '@/features/playbooks/validations';

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

// ─── playbookInsertSchema ────────────────────────────────────────────────────
describe('playbookInsertSchema', () => {
  it('validates a playbook with only name', () => {
    const result = playbookInsertSchema.safeParse({ name: 'Breakout Strategy' });
    expect(result.success).toBe(true);
  });

  it('validates a playbook with all fields', () => {
    const result = playbookInsertSchema.safeParse({
      name: 'Full Strategy',
      description: 'A complete strategy',
      entryRules: 'Buy on breakout above resistance',
      exitRules: 'Sell at 2R or stop loss',
      marketConditions: 'Trending bull market',
      positionSizingRules: 'Risk 2% per trade',
    });
    expect(result.success).toBe(true);
  });

  it('fails when name is empty', () => {
    const result = playbookInsertSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('fails when name is missing', () => {
    const result = playbookInsertSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 200 characters', () => {
    const result = playbookInsertSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('accepts null for optional fields', () => {
    const result = playbookInsertSchema.safeParse({
      name: 'Test',
      description: null,
      entryRules: null,
      exitRules: null,
      marketConditions: null,
      positionSizingRules: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts undefined for optional fields', () => {
    const result = playbookInsertSchema.safeParse({
      name: 'Test',
      description: undefined,
    });
    expect(result.success).toBe(true);
  });
});
