import { describe, it, expect } from 'vitest';
import { tradeInsertSchema } from '@/features/trades/validations';

describe('tradeInsertSchema', () => {
  const validTrade = {
    assetClass: 'stock' as const,
    ticker: 'aapl',
    direction: 'long' as const,
    entryDate: '2024-01-15T10:00',
    entryPrice: 150.25,
    positionSize: 100,
  };

  it('validates a valid stock trade', () => {
    const result = tradeInsertSchema.safeParse(validTrade);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ticker).toBe('AAPL'); // uppercased
    }
  });

  it('fails when ticker is empty', () => {
    const result = tradeInsertSchema.safeParse({ ...validTrade, ticker: '' });
    expect(result.success).toBe(false);
  });

  it('fails when entry price is negative', () => {
    const result = tradeInsertSchema.safeParse({ ...validTrade, entryPrice: -10 });
    expect(result.success).toBe(false);
  });

  it('fails when position size is zero', () => {
    const result = tradeInsertSchema.safeParse({ ...validTrade, positionSize: 0 });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be omitted', () => {
    const result = tradeInsertSchema.safeParse(validTrade);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
      expect(result.data.exitPrice).toBeUndefined();
    }
  });

  it('defaults commissions and fees to 0', () => {
    const result = tradeInsertSchema.safeParse(validTrade);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commissions).toBe(0);
      expect(result.data.fees).toBe(0);
    }
  });

  it('accepts all valid asset classes', () => {
    for (const ac of ['stock', 'option', 'crypto'] as const) {
      const result = tradeInsertSchema.safeParse({ ...validTrade, assetClass: ac });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid asset class', () => {
    const result = tradeInsertSchema.safeParse({ ...validTrade, assetClass: 'forex' });
    expect(result.success).toBe(false);
  });
});
