/**
 * Integration-style tests for CSV import: parse → validate → insert flow.
 * DB insert is mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockInsert } = vi.hoisted(() => {
  const insertChain = {
    values: vi.fn().mockResolvedValue(undefined),
  };
  return { mockInsert: vi.fn().mockReturnValue(insertChain) };
});

vi.mock('@/lib/db', () => ({
  db: { insert: mockInsert },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { importTradesFromCsv } from '@/features/settings/services/actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeCsvFile(content: string): File {
  return new File([content], 'trades.csv', { type: 'text/csv' });
}

function makeFormData(file: File): FormData {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

const VALID_CSV = [
  'ticker,assetClass,direction,entryDate,entryPrice,positionSize',
  'AAPL,stock,long,2026-03-01,175.5,100',
  'TSLA,stock,short,2026-03-02,250.0,50',
].join('\n');

const PARTIAL_INVALID_CSV = [
  'ticker,assetClass,direction,entryDate,entryPrice,positionSize',
  'AAPL,stock,long,2026-03-01,175.5,100',
  ',stock,long,2026-03-01,175.5,100',  // missing ticker
  'TSLA,bond,long,2026-03-01,175.5,100',  // invalid assetClass
].join('\n');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('importTradesFromCsv', () => {
  beforeEach(() => vi.clearAllMocks());

  it('imports all rows from a valid CSV', async () => {
    const insertChain = { values: vi.fn().mockResolvedValue(undefined) };
    mockInsert.mockReturnValue(insertChain);

    const fd = makeFormData(makeCsvFile(VALID_CSV));
    const result = await importTradesFromCsv({ success: false }, fd);

    expect(result.success).toBe(true);
    expect(result.data?.imported).toBe(2);
    expect(result.data?.skipped).toBe(0);
    expect(result.data?.errors).toHaveLength(0);
  });

  it('skips invalid rows and reports errors', async () => {
    const insertChain = { values: vi.fn().mockResolvedValue(undefined) };
    mockInsert.mockReturnValue(insertChain);

    const fd = makeFormData(makeCsvFile(PARTIAL_INVALID_CSV));
    const result = await importTradesFromCsv({ success: false }, fd);

    expect(result.success).toBe(true);
    expect(result.data?.imported).toBe(1);
    expect(result.data?.skipped).toBe(2);
    expect(result.data?.errors.length).toBe(2);
    expect(result.data?.errors[0].row).toBe(3);
  });

  it('returns error when no file provided', async () => {
    const fd = new FormData();
    const result = await importTradesFromCsv({ success: false }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no file/i);
  });

  it('returns error when CSV has only a header row', async () => {
    const headerOnly = makeCsvFile('ticker,assetClass,direction,entryDate,entryPrice,positionSize');
    const fd = makeFormData(headerOnly);
    const result = await importTradesFromCsv({ success: false }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/header row/i);
  });

  it('handles DB insert failure gracefully per row', async () => {
    const insertChain = { values: vi.fn().mockRejectedValue(new Error('DB error')) };
    mockInsert.mockReturnValue(insertChain);

    const fd = makeFormData(makeCsvFile(VALID_CSV));
    const result = await importTradesFromCsv({ success: false }, fd);

    // Both rows fail on insert → 0 imported, 2 skipped
    expect(result.success).toBe(true);
    expect(result.data?.imported).toBe(0);
    expect(result.data?.skipped).toBe(2);
    expect(result.data?.errors).toHaveLength(2);
  });
});
