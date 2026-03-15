/**
 * Tests for /api/export/csv and /api/export/json route handlers.
 * DB is mocked — no real SQLite is touched.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockSelect } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  return { mockSelect };
});

vi.mock('@/lib/db', () => ({
  db: { select: mockSelect },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────
import { GET as csvGET } from '@/app/api/export/csv/route';
import { GET as jsonGET } from '@/app/api/export/json/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeSelectChain(returnValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ['from', 'orderBy', 'where', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain['orderBy'] = vi.fn().mockResolvedValue(returnValue);
  return chain;
}

const sampleTrade = {
  id: 'trade-001',
  ticker: 'AAPL',
  assetClass: 'stock',
  direction: 'long',
  entryDate: '2026-03-01',
  entryPrice: 175.5,
  positionSize: 100,
  exitDate: null,
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

// ─── CSV export ───────────────────────────────────────────────────────────────

describe('GET /api/export/csv', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with text/csv content-type', async () => {
    mockSelect.mockReturnValue(makeSelectChain([sampleTrade]));
    const res = await csvGET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
  });

  it('sets Content-Disposition attachment header', async () => {
    mockSelect.mockReturnValue(makeSelectChain([sampleTrade]));
    const res = await csvGET();
    expect(res.headers.get('content-disposition')).toMatch(/attachment/);
    expect(res.headers.get('content-disposition')).toMatch(/trades\.csv/);
  });

  it('CSV body contains header row and data row', async () => {
    mockSelect.mockReturnValue(makeSelectChain([sampleTrade]));
    const res = await csvGET();
    const text = await res.text();
    expect(text).toContain('ticker');
    expect(text).toContain('AAPL');
  });

  it('handles empty trades gracefully', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));
    const res = await csvGET();
    expect(res.status).toBe(200);
  });

  it('returns 500 on DB error', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const res = await csvGET();
    expect(res.status).toBe(500);
  });
});

// ─── JSON export ──────────────────────────────────────────────────────────────

describe('GET /api/export/json', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with application/json content-type', async () => {
    mockSelect.mockReturnValue(makeSelectChain([sampleTrade]));
    const res = await jsonGET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('sets Content-Disposition attachment header', async () => {
    mockSelect.mockReturnValue(makeSelectChain([sampleTrade]));
    const res = await jsonGET();
    expect(res.headers.get('content-disposition')).toMatch(/attachment/);
    expect(res.headers.get('content-disposition')).toMatch(/trades\.json/);
  });

  it('JSON body is valid and contains trade data', async () => {
    mockSelect.mockReturnValue(makeSelectChain([sampleTrade]));
    const res = await jsonGET();
    const text = await res.text();
    const data = JSON.parse(text);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].ticker).toBe('AAPL');
  });

  it('returns 500 on DB error', async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const res = await jsonGET();
    expect(res.status).toBe(500);
  });
});
