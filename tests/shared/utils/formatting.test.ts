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

  it('formats with custom currency', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('defaults to USD when no currency specified', () => {
    expect(formatCurrency(100)).toBe('$100.00');
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
  // Use a date that won't shift days across timezones
  const iso = '2024-01-15T12:00:00.000Z';

  it('defaults to MM/DD/YYYY when no format specified', () => {
    expect(formatDate(iso)).toBe('01/15/2024');
  });

  it('formats as MM/DD/YYYY', () => {
    expect(formatDate(iso, 'MM/DD/YYYY')).toBe('01/15/2024');
  });

  it('formats as DD/MM/YYYY', () => {
    expect(formatDate(iso, 'DD/MM/YYYY')).toBe('15/01/2024');
  });

  it('formats as YYYY-MM-DD', () => {
    expect(formatDate(iso, 'YYYY-MM-DD')).toBe('2024-01-15');
  });

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });
});

describe('formatPrice', () => {
  it('formats price with dollar sign', () => {
    expect(formatPrice(150.25)).toBe('$150.25');
  });

  it('returns dash for null', () => {
    expect(formatPrice(null)).toBe('—');
  });

  it('formats with custom currency', () => {
    expect(formatPrice(150.25, 'EUR')).toBe('€150.25');
  });
});
