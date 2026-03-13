import { describe, it, expect } from 'vitest';
import { tradeInsertSchema, exitLegInsertSchema } from '@/features/trades/validations';

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

  it('accepts stock and crypto asset classes without extra fields', () => {
    for (const ac of ['stock', 'crypto'] as const) {
      const result = tradeInsertSchema.safeParse({ ...validTrade, assetClass: ac });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid asset class', () => {
    const result = tradeInsertSchema.safeParse({ ...validTrade, assetClass: 'forex' });
    expect(result.success).toBe(false);
  });

  it('defaults contractMultiplier to 100', () => {
    const result = tradeInsertSchema.safeParse(validTrade);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contractMultiplier).toBe(100);
    }
  });
});

describe('tradeInsertSchema — option validation', () => {
  const validOption = {
    assetClass: 'option' as const,
    ticker: 'SPY',
    direction: 'long' as const,
    entryDate: '2024-01-15T10:00',
    entryPrice: 2.5,
    positionSize: 1,
    optionType: 'call' as const,
    strike: 450,
    expiry: '2024-02-16',
    contracts: 5,
  };

  it('validates a valid option trade', () => {
    const result = tradeInsertSchema.safeParse(validOption);
    expect(result.success).toBe(true);
  });

  it('fails when optionType is missing', () => {
    const result = tradeInsertSchema.safeParse({ ...validOption, optionType: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('optionType');
    }
  });

  it('fails when strike is missing', () => {
    const result = tradeInsertSchema.safeParse({ ...validOption, strike: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('strike');
    }
  });

  it('fails when expiry is missing', () => {
    const result = tradeInsertSchema.safeParse({ ...validOption, expiry: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('expiry');
    }
  });

  it('fails when contracts is missing', () => {
    const result = tradeInsertSchema.safeParse({ ...validOption, contracts: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('contracts');
    }
  });

  it('accepts optional Greeks fields', () => {
    const result = tradeInsertSchema.safeParse({
      ...validOption,
      delta: 0.45,
      gamma: 0.02,
      theta: -0.05,
      vega: 0.15,
      iv: 0.25,
      ivRank: 60,
    });
    expect(result.success).toBe(true);
  });

  it('accepts spread fields', () => {
    const result = tradeInsertSchema.safeParse({
      ...validOption,
      spreadId: 'abc123',
      spreadType: 'vertical' as const,
    });
    expect(result.success).toBe(true);
  });

  it('rejects ivRank > 100', () => {
    const result = tradeInsertSchema.safeParse({ ...validOption, ivRank: 110 });
    expect(result.success).toBe(false);
  });
});

describe('tradeInsertSchema — crypto validation', () => {
  const validCrypto = {
    assetClass: 'crypto' as const,
    ticker: 'BTC',
    direction: 'long' as const,
    entryDate: '2024-01-15T10:00',
    entryPrice: 50000,
    positionSize: 0.5,
  };

  it('validates a valid crypto trade without extra fields', () => {
    const result = tradeInsertSchema.safeParse(validCrypto);
    expect(result.success).toBe(true);
  });

  it('accepts optional crypto fields', () => {
    const result = tradeInsertSchema.safeParse({
      ...validCrypto,
      exchange: 'Binance',
      tradingPair: 'BTC/USDT',
      leverage: 2,
      makerFee: 0.001,
      takerFee: 0.001,
      networkFee: 5,
      fundingRate: 0.0001,
      liquidationPrice: 25000,
      marketCapCategory: 'large' as const,
    });
    expect(result.success).toBe(true);
  });

  it('rejects leverage less than 1', () => {
    const result = tradeInsertSchema.safeParse({ ...validCrypto, leverage: 0.5 });
    expect(result.success).toBe(false);
  });

  it('rejects btcCorrelation outside [-1, 1]', () => {
    const result = tradeInsertSchema.safeParse({ ...validCrypto, btcCorrelation: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe('exitLegInsertSchema', () => {
  const validLeg = {
    exitDate: '2024-02-01T14:00',
    exitPrice: 155.0,
    quantity: 50,
  };

  it('validates a valid exit leg', () => {
    const result = exitLegInsertSchema.safeParse(validLeg);
    expect(result.success).toBe(true);
  });

  it('defaults fees to 0', () => {
    const result = exitLegInsertSchema.safeParse(validLeg);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fees).toBe(0);
    }
  });

  it('fails when exitDate is missing', () => {
    const result = exitLegInsertSchema.safeParse({ ...validLeg, exitDate: '' });
    expect(result.success).toBe(false);
  });

  it('fails when exitPrice is not positive', () => {
    const result = exitLegInsertSchema.safeParse({ ...validLeg, exitPrice: 0 });
    expect(result.success).toBe(false);
  });

  it('fails when quantity is not positive', () => {
    const result = exitLegInsertSchema.safeParse({ ...validLeg, quantity: -10 });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = exitLegInsertSchema.safeParse({
      ...validLeg,
      exitReason: 'target_hit',
      fees: 2.5,
      notes: 'First target reached',
    });
    expect(result.success).toBe(true);
  });
});
