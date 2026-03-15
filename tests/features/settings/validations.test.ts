import { describe, it, expect } from 'vitest';
import { settingsSchema, importedTradeSchema } from '@/features/settings/validations';

// ─── settingsSchema ────────────────────────────────────────────────────────────

describe('settingsSchema', () => {
  const valid = {
    traderName: 'Alice',
    timezone: 'America/New_York',
    currency: 'USD',
    startingCapital: 50000,
    defaultCommission: 4.95,
    defaultRiskPercent: 1.5,
    positionSizingMethod: 'fixed-dollar' as const,
    dateFormat: 'MM/DD/YYYY',
    theme: 'system' as const,
  };

  it('accepts a fully valid settings object', () => {
    const result = settingsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts null startingCapital', () => {
    const result = settingsSchema.safeParse({ ...valid, startingCapital: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.startingCapital).toBeNull();
  });

  it('rejects negative startingCapital', () => {
    const result = settingsSchema.safeParse({ ...valid, startingCapital: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects commission < 0', () => {
    const result = settingsSchema.safeParse({ ...valid, defaultCommission: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects riskPercent < 0.01', () => {
    const result = settingsSchema.safeParse({ ...valid, defaultRiskPercent: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects riskPercent > 100', () => {
    const result = settingsSchema.safeParse({ ...valid, defaultRiskPercent: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts all valid positionSizingMethod values', () => {
    for (const method of ['fixed-dollar', 'percent-equity', 'kelly']) {
      const result = settingsSchema.safeParse({ ...valid, positionSizingMethod: method });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid positionSizingMethod', () => {
    const result = settingsSchema.safeParse({ ...valid, positionSizingMethod: 'martingale' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid themes', () => {
    for (const theme of ['light', 'dark', 'system']) {
      const result = settingsSchema.safeParse({ ...valid, theme });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid theme', () => {
    const result = settingsSchema.safeParse({ ...valid, theme: 'pink' });
    expect(result.success).toBe(false);
  });

  it('rejects currency with wrong length', () => {
    const result = settingsSchema.safeParse({ ...valid, currency: 'US' });
    expect(result.success).toBe(false);
  });

  it('rejects traderName longer than 100 chars', () => {
    const result = settingsSchema.safeParse({ ...valid, traderName: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('defaults are applied when fields are missing', () => {
    const result = settingsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.traderName).toBe('');
      expect(result.data.timezone).toBe('America/New_York');
      expect(result.data.currency).toBe('USD');
      expect(result.data.defaultCommission).toBe(0);
      expect(result.data.defaultRiskPercent).toBe(1);
      expect(result.data.positionSizingMethod).toBe('fixed-dollar');
      expect(result.data.theme).toBe('system');
    }
  });
});

// ─── importedTradeSchema ───────────────────────────────────────────────────────

describe('importedTradeSchema', () => {
  const validRow = {
    ticker: 'AAPL',
    assetClass: 'stock' as const,
    direction: 'long' as const,
    entryDate: '2026-03-01',
    entryPrice: 175.5,
    positionSize: 100,
  };

  it('accepts a minimal valid row', () => {
    const result = importedTradeSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = importedTradeSchema.safeParse({
      ...validRow,
      exitDate: '2026-03-10',
      exitPrice: 180,
      commissions: 4.95,
      fees: 0,
      notes: 'Good trade',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing ticker', () => {
    const result = importedTradeSchema.safeParse({ ...validRow, ticker: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid assetClass', () => {
    const result = importedTradeSchema.safeParse({ ...validRow, assetClass: 'bond' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid direction', () => {
    const result = importedTradeSchema.safeParse({ ...validRow, direction: 'neutral' });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive entryPrice', () => {
    const result = importedTradeSchema.safeParse({ ...validRow, entryPrice: 0 });
    expect(result.success).toBe(false);
  });

  it('coerces string numbers for entryPrice', () => {
    const result = importedTradeSchema.safeParse({ ...validRow, entryPrice: '175.5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.entryPrice).toBe(175.5);
  });
});
