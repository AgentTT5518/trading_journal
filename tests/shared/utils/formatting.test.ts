import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatPrice,
} from '@/shared/utils/formatting';

describe('formatCurrency', () => {
  it('formats positive number', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats negative number', () => {
    expect(formatCurrency(-500)).toBe('-$500.00');
  });

  it('returns dash for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatPercent', () => {
  it('formats positive with plus sign', () => {
    expect(formatPercent(10.5)).toBe('+10.50%');
  });

  it('formats negative', () => {
    expect(formatPercent(-3.2)).toBe('-3.20%');
  });

  it('formats zero with plus sign', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('returns dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2024-01-15T10:00:00.000Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('formatPrice', () => {
  it('formats price with dollar sign', () => {
    expect(formatPrice(150.25)).toBe('$150.25');
  });

  it('returns dash for null', () => {
    expect(formatPrice(null)).toBe('—');
  });
});
