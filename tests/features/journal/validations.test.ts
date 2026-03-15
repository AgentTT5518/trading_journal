import { describe, it, expect } from 'vitest';
import { journalInsertSchema } from '@/features/journal/validations';

describe('journalInsertSchema', () => {
  const validEntry = {
    date: '2026-03-15',
    category: 'pre_market' as const,
    content: 'Market looks strong today. Watching NVDA for a breakout.',
  };

  it('validates a minimal valid entry', () => {
    const result = journalInsertSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('validates a full entry with all fields', () => {
    const result = journalInsertSchema.safeParse({
      ...validEntry,
      title: 'Pre-Market Prep',
      mood: 4,
      energy: 5,
      marketSentiment: 'bullish',
      tradeIds: ['abc123', 'def456'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Pre-Market Prep');
      expect(result.data.mood).toBe(4);
      expect(result.data.energy).toBe(5);
      expect(result.data.marketSentiment).toBe('bullish');
      expect(result.data.tradeIds).toEqual(['abc123', 'def456']);
    }
  });

  // Category enum
  it('accepts all valid categories', () => {
    const categories = ['pre_market', 'post_market', 'intraday', 'general', 'lesson'];
    for (const category of categories) {
      const result = journalInsertSchema.safeParse({ ...validEntry, category });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, category: 'evening' });
    expect(result.success).toBe(false);
  });

  // Required fields
  it('fails when date is missing', () => {
    const rest = Object.fromEntries(Object.entries(validEntry).filter(([k]) => k !== 'date'));
    const result = journalInsertSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when date is empty', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, date: '' });
    expect(result.success).toBe(false);
  });

  it('fails when category is missing', () => {
    const rest = Object.fromEntries(Object.entries(validEntry).filter(([k]) => k !== 'category'));
    const result = journalInsertSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when content is missing', () => {
    const rest = Object.fromEntries(Object.entries(validEntry).filter(([k]) => k !== 'content'));
    const result = journalInsertSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when content is empty', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, content: '' });
    expect(result.success).toBe(false);
  });

  // Mood validation
  it('accepts mood values 1-5', () => {
    for (const mood of [1, 2, 3, 4, 5]) {
      const result = journalInsertSchema.safeParse({ ...validEntry, mood });
      expect(result.success).toBe(true);
    }
  });

  it('rejects mood below 1', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, mood: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects mood above 5', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, mood: 6 });
    expect(result.success).toBe(false);
  });

  it('allows null mood', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, mood: null });
    expect(result.success).toBe(true);
  });

  // Energy validation
  it('accepts energy values 1-5', () => {
    for (const energy of [1, 2, 3, 4, 5]) {
      const result = journalInsertSchema.safeParse({ ...validEntry, energy });
      expect(result.success).toBe(true);
    }
  });

  it('rejects energy below 1', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, energy: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects energy above 5', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, energy: 6 });
    expect(result.success).toBe(false);
  });

  it('allows null energy', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, energy: null });
    expect(result.success).toBe(true);
  });

  // Market sentiment enum
  it('accepts all valid market sentiments', () => {
    const sentiments = ['bullish', 'bearish', 'neutral', 'uncertain'];
    for (const marketSentiment of sentiments) {
      const result = journalInsertSchema.safeParse({ ...validEntry, marketSentiment });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid market sentiment', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, marketSentiment: 'mixed' });
    expect(result.success).toBe(false);
  });

  it('allows null market sentiment', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, marketSentiment: null });
    expect(result.success).toBe(true);
  });

  // Optional fields
  it('allows undefined optional fields', () => {
    const result = journalInsertSchema.safeParse(validEntry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBeUndefined();
      expect(result.data.mood).toBeUndefined();
      expect(result.data.energy).toBeUndefined();
      expect(result.data.marketSentiment).toBeUndefined();
      expect(result.data.tradeIds).toBeUndefined();
    }
  });

  it('coerces string mood to number', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, mood: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mood).toBe(3);
    }
  });

  it('coerces string energy to number', () => {
    const result = journalInsertSchema.safeParse({ ...validEntry, energy: '2' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.energy).toBe(2);
    }
  });
});
