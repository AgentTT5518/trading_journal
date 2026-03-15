import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockInsert, mockDelete, mockUpdate } = vi.hoisted(() => {
  const chain = () => ({
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  });
  return {
    mockInsert: vi.fn().mockReturnValue(chain()),
    mockDelete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    mockUpdate: vi.fn().mockReturnValue(chain()),
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate,
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { updateSettings, clearAllTrades, importTradesFromCsv } from '@/features/settings/services/actions';
import { settingsSchema } from '@/features/settings/validations';

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeFormData(obj: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) fd.append(k, v);
  return fd;
}

const validSettings = {
  traderName: 'Alice',
  timezone: 'America/New_York',
  currency: 'USD',
  startingCapital: '',
  defaultCommission: '4.95',
  defaultRiskPercent: '1.5',
  positionSizingMethod: 'fixed-dollar',
  dateFormat: 'MM/DD/YYYY',
  theme: 'system',
};

// ─── updateSettings ───────────────────────────────────────────────────────────

describe('updateSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success for valid settings', async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    };
    mockInsert.mockReturnValue(chain);

    const result = await updateSettings({ success: false }, makeFormData(validSettings));
    expect(result.success).toBe(true);
    expect(result.message).toBe('Settings saved');
  });

  it('returns validation errors for invalid risk percent', async () => {
    const result = await updateSettings(
      { success: false },
      makeFormData({ ...validSettings, defaultRiskPercent: '0' })
    );
    expect(result.success).toBe(false);
    expect(result.errors?.defaultRiskPercent).toBeDefined();
  });

  it('returns validation errors for invalid currency', async () => {
    const result = await updateSettings(
      { success: false },
      makeFormData({ ...validSettings, currency: 'US' })
    );
    expect(result.success).toBe(false);
    expect(result.errors?.currency).toBeDefined();
  });

  it('returns error on DB failure', async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockRejectedValue(new Error('DB error')),
    };
    mockInsert.mockReturnValue(chain);

    const result = await updateSettings({ success: false }, makeFormData(validSettings));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unexpected error/i);
  });

  it('uses fallback defaults when optional fields are absent (lines 21-23, 25, 27-29: || right sides)', async () => {
    // traderName, timezone, currency, defaultCommission, positionSizingMethod, dateFormat, theme all absent
    // → right-side fallback values kick in: '', 'America/New_York', 'USD', 0, 'fixed-dollar', 'MM/DD/YYYY', 'system'
    const chain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    };
    mockInsert.mockReturnValue(chain);

    const result = await updateSettings({ success: false }, makeFormData({ defaultRiskPercent: '1.5' }));
    expect(result.success).toBe(true);
  });

  it('uses Number(startingCapital) when provided and :1 fallback when defaultRiskPercent absent (lines 24, 26)', async () => {
    // startingCapital: '100000' → line 24 truthy branch: Number('100000')
    // defaultRiskPercent absent → line 26 falsy branch: default 1 (> 0.01, passes validation)
    const chain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    };
    mockInsert.mockReturnValue(chain);

    const result = await updateSettings(
      { success: false },
      makeFormData({ ...validSettings, startingCapital: '100000', defaultRiskPercent: '' }),
    );
    expect(result.success).toBe(true);
  });

  it('accumulates multiple errors for the same field key (line 36: else branch)', async () => {
    const mockResult = { success: false, error: { issues: [
      { path: ['currency'], message: 'Error 1' },
      { path: ['currency'], message: 'Error 2' },
    ] } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(settingsSchema, 'safeParse').mockReturnValueOnce(mockResult as any);

    const result = await updateSettings({ success: false }, makeFormData(validSettings));

    spy.mockRestore();
    expect(result.success).toBe(false);
    expect(Array.isArray(result.errors?.currency)).toBe(true);
    expect(result.errors?.currency).toHaveLength(2);
  });
});

// ─── clearAllTrades ───────────────────────────────────────────────────────────

describe('clearAllTrades', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes all trades when confirmation is DELETE', async () => {
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    // clearAllTrades uses db.delete(trades) without .where — mock returns value directly
    mockDelete.mockResolvedValue(undefined);

    const fd = makeFormData({ confirmation: 'DELETE' });
    const result = await clearAllTrades({ success: false }, fd);
    expect(result.success).toBe(true);
  });

  it('rejects wrong confirmation word', async () => {
    const fd = makeFormData({ confirmation: 'delete' });
    const result = await clearAllTrades({ success: false }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/DELETE/);
  });

  it('returns error on DB failure', async () => {
    mockDelete.mockRejectedValue(new Error('DB error'));
    const fd = makeFormData({ confirmation: 'DELETE' });
    const result = await clearAllTrades({ success: false }, fd);
    expect(result.success).toBe(false);
  });
});

// ─── importTradesFromCsv ───────────────────────────────────────────────────────

describe('importTradesFromCsv', () => {
  beforeEach(() => vi.clearAllMocks());

  const validCsvRow = 'ticker,assetClass,direction,entryDate,entryPrice,positionSize\nAAPL,stock,long,2026-01-15,150,100';

  it('returns error when no file is provided', async () => {
    const fd = new FormData();
    const result = await importTradesFromCsv({ success: false }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('No file provided');
  });

  it('returns error when CSV has only a header row (no data)', async () => {
    const file = new File(['ticker,assetClass\n'], 'test.csv', { type: 'text/csv' });
    const fd = new FormData();
    fd.append('file', file);
    const result = await importTradesFromCsv({ success: false }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/header row/);
  });

  it('records skipped row on validation failure', async () => {
    const csv = 'ticker,assetClass,direction,entryDate,entryPrice,positionSize\n,stock,long,2026-01-15,150,100';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const fd = new FormData();
    fd.append('file', file);
    const result = await importTradesFromCsv({ success: false }, fd);
    expect(result.success).toBe(true);
    expect(result.data?.skipped).toBe(1);
    expect(result.data?.errors.length).toBeGreaterThan(0);
  });

  it('catches per-row DB insert failure and records it in errors without aborting', async () => {
    const chain = {
      values: vi.fn().mockRejectedValue(new Error('DB constraint violation')),
    };
    mockInsert.mockReturnValue(chain);

    const file = new File([validCsvRow], 'test.csv', { type: 'text/csv' });
    const fd = new FormData();
    fd.append('file', file);

    const result = await importTradesFromCsv({ success: false }, fd);
    // Overall import succeeds (outer try didn't throw)
    expect(result.success).toBe(true);
    expect(result.data?.imported).toBe(0);
    expect(result.data?.skipped).toBe(1);
    expect(result.data?.errors[0].message).toBe('Database insert failed');
  });

  it('catches catastrophic failure (outer catch) when file.text() throws', async () => {
    const brokenFile = { size: 100, text: () => Promise.reject(new Error('Read error')) } as unknown as File;
    const fd = new FormData();
    fd.append('file', brokenFile);

    const result = await importTradesFromCsv({ success: false }, fd);
    expect(result.success).toBe(false);
    expect(result.message).toBe('An unexpected error occurred during import');
  });

  it('uses snake_case column aliases when camelCase columns are absent (lines 92, 94-96)', async () => {
    // Covers obj.asset_class, obj.entry_date, obj.entry_price, obj.position_size fallback branches
    const chain = { values: vi.fn().mockResolvedValue(undefined) };
    mockInsert.mockReturnValue(chain);

    const csv = 'ticker,asset_class,direction,entry_date,entry_price,position_size\nTSLA,stock,long,2026-01-15,200,50';
    const file = new File([csv], 'trades.csv', { type: 'text/csv' });
    const fd = new FormData();
    fd.append('file', file);

    const result = await importTradesFromCsv({ success: false }, fd);
    expect(result.success).toBe(true);
    expect(result.data?.imported).toBe(1);
  });

  it('pads missing row values with empty string when row is shorter than headers (line 87)', async () => {
    // Covers values[idx] ?? '' right-side branch
    // Row has 3 values but headers has 6 → values[3..5] are undefined → ?? '' fills them in
    const csv = 'ticker,asset_class,direction,entry_date,entry_price,position_size\nMSFT,stock,long';
    const file = new File([csv], 'short.csv', { type: 'text/csv' });
    const fd = new FormData();
    fd.append('file', file);

    const result = await importTradesFromCsv({ success: false }, fd);
    // Row is skipped because entryDate/entryPrice/positionSize are empty → Zod validation fails
    expect(result.success).toBe(true);
    expect(result.data?.skipped).toBe(1);
  });
});
