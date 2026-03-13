/**
 * Integration tests for screenshot server actions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockSelect, mockDelete } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockDelete = vi.fn();
  return { mockSelect, mockDelete };
});

// ─── Module mocks ────────────────────────────────────────────────────────────
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
    delete: mockDelete,
  },
}));

vi.mock('@/features/screenshots/services/storage', () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

// ─── Imports ─────────────────────────────────────────────────────────────────
import { deleteScreenshot } from '@/features/screenshots/services/actions';

// ─── deleteScreenshot ────────────────────────────────────────────────────────
describe('deleteScreenshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a screenshot and returns success', async () => {
    // Mock select to find the screenshot
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ filename: 'abc123.png' }]),
    });
    mockSelect.mockReturnValue({ from: mockFrom });
    mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

    const result = await deleteScreenshot('ss-1', 'trade-1');

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('returns error when screenshot not found', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
    mockSelect.mockReturnValue({ from: mockFrom });

    const result = await deleteScreenshot('ss-missing', 'trade-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Screenshot not found');
  });

  it('returns error when DB throws', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    mockSelect.mockReturnValue({ from: mockFrom });

    const result = await deleteScreenshot('ss-1', 'trade-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to delete screenshot');
  });
});
