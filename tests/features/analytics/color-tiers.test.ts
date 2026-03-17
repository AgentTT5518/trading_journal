import { describe, it, expect } from 'vitest';
import { getPnlColorClass, getPnlColorTier } from '@/features/analytics/utils/color-tiers';

describe('getPnlColorTier', () => {
  it('returns neutral (muted) for null pnl', () => {
    const tier = getPnlColorTier(null, 1000, 500);
    expect(tier.bg).toBe('bg-muted');
    expect(tier.text).toBe('text-muted-foreground');
  });

  it('returns breakeven for zero pnl', () => {
    const tier = getPnlColorTier(0, 1000, 500);
    expect(tier.bg).toBe('bg-gray-300');
    expect(tier.text).toBe('text-gray-700');
  });

  describe('positive pnl (green tiers)', () => {
    it('returns green-200 for small profit (<=25% of max)', () => {
      const tier = getPnlColorTier(100, 1000, 500);
      expect(tier.bg).toBe('bg-green-200');
    });

    it('returns green-400 for moderate profit (25-50% of max)', () => {
      const tier = getPnlColorTier(400, 1000, 500);
      expect(tier.bg).toBe('bg-green-400');
    });

    it('returns green-600 for large profit (50-75% of max)', () => {
      const tier = getPnlColorTier(600, 1000, 500);
      expect(tier.bg).toBe('bg-green-600');
    });

    it('returns green-800 for max profit (>75% of max)', () => {
      const tier = getPnlColorTier(900, 1000, 500);
      expect(tier.bg).toBe('bg-green-800');
    });

    it('returns green-800 when pnl equals max profit', () => {
      const tier = getPnlColorTier(1000, 1000, 500);
      expect(tier.bg).toBe('bg-green-800');
    });

    it('clamps ratio to 1 when pnl exceeds max profit', () => {
      const tier = getPnlColorTier(2000, 1000, 500);
      expect(tier.bg).toBe('bg-green-800');
    });
  });

  describe('negative pnl (red tiers)', () => {
    it('returns red-200 for small loss (<=25% of max)', () => {
      const tier = getPnlColorTier(-50, 1000, 500);
      expect(tier.bg).toBe('bg-red-200');
    });

    it('returns red-400 for moderate loss (25-50% of max)', () => {
      const tier = getPnlColorTier(-200, 1000, 500);
      expect(tier.bg).toBe('bg-red-400');
    });

    it('returns red-600 for large loss (50-75% of max)', () => {
      const tier = getPnlColorTier(-350, 1000, 500);
      expect(tier.bg).toBe('bg-red-600');
    });

    it('returns red-800 for max loss (>75% of max)', () => {
      const tier = getPnlColorTier(-450, 1000, 500);
      expect(tier.bg).toBe('bg-red-800');
    });
  });

  describe('edge cases', () => {
    it('returns green-200 when maxProfit is 0', () => {
      const tier = getPnlColorTier(100, 0, 500);
      expect(tier.bg).toBe('bg-green-200');
    });

    it('returns red-200 when maxLoss is 0', () => {
      const tier = getPnlColorTier(-100, 1000, 0);
      expect(tier.bg).toBe('bg-red-200');
    });

    it('handles very small values', () => {
      const tier = getPnlColorTier(0.01, 100, 50);
      expect(tier.bg).toBe('bg-green-200');
    });

    it('handles very small negative values', () => {
      const tier = getPnlColorTier(-0.01, 100, 50);
      expect(tier.bg).toBe('bg-red-200');
    });
  });
});

describe('getPnlColorClass', () => {
  it('returns combined bg + text class string', () => {
    const result = getPnlColorClass(null, 1000, 500);
    expect(result).toBe('bg-muted text-muted-foreground');
  });

  it('returns green classes for positive pnl', () => {
    const result = getPnlColorClass(1000, 1000, 500);
    expect(result).toContain('bg-green');
    expect(result).toContain('text-');
  });

  it('returns red classes for negative pnl', () => {
    const result = getPnlColorClass(-500, 1000, 500);
    expect(result).toContain('bg-red');
    expect(result).toContain('text-');
  });
});
