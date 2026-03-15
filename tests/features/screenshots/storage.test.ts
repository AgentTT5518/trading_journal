import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockMkdir, mockWriteFile, mockReadFile, mockUnlink, mockRm } = vi.hoisted(() => ({
  mockMkdir: vi.fn(),
  mockWriteFile: vi.fn(),
  mockReadFile: vi.fn(),
  mockUnlink: vi.fn(),
  mockRm: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  readFile: mockReadFile,
  unlink: mockUnlink,
  rm: mockRm,
}));

vi.mock('@/lib/config', () => ({
  APP_CONFIG: { screenshotDir: '/data/screenshots' },
}));

vi.mock('@/lib/ids', () => ({ generateId: () => 'mock-file-id' }));

vi.mock('@/features/screenshots/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  ensureTradeDir,
  saveFile,
  readFileFromDisk,
  deleteFile,
  deleteTradeScreenshotDir,
  getExtension,
  getMimeType,
} from '@/features/screenshots/services/storage';

describe('getExtension', () => {
  it('returns jpg for image/jpeg', () => {
    expect(getExtension('image/jpeg')).toBe('jpg');
  });

  it('returns png for image/png', () => {
    expect(getExtension('image/png')).toBe('png');
  });

  it('returns gif for image/gif', () => {
    expect(getExtension('image/gif')).toBe('gif');
  });

  it('returns webp for image/webp', () => {
    expect(getExtension('image/webp')).toBe('webp');
  });

  it('returns bin for unknown type', () => {
    expect(getExtension('application/pdf')).toBe('bin');
  });
});

describe('getMimeType', () => {
  it('returns image/jpeg for .jpg', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
  });

  it('returns image/jpeg for .jpeg', () => {
    expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
  });

  it('returns image/png for .png', () => {
    expect(getMimeType('chart.png')).toBe('image/png');
  });

  it('returns image/gif for .gif', () => {
    expect(getMimeType('anim.gif')).toBe('image/gif');
  });

  it('returns image/webp for .webp', () => {
    expect(getMimeType('photo.webp')).toBe('image/webp');
  });

  it('returns application/octet-stream for unknown ext', () => {
    expect(getMimeType('file.xyz')).toBe('application/octet-stream');
  });
});

// ─── File I/O functions ───────────────────────────────────────────────────────

describe('ensureTradeDir', () => {
  afterEach(() => vi.clearAllMocks());

  it('creates the trade directory with recursive option and returns its path', async () => {
    mockMkdir.mockResolvedValue(undefined);
    const result = await ensureTradeDir('trade-123');
    expect(mockMkdir).toHaveBeenCalledWith('/data/screenshots/trade-123', { recursive: true });
    expect(result).toBe('/data/screenshots/trade-123');
  });
});

describe('saveFile', () => {
  afterEach(() => vi.clearAllMocks());

  it('writes buffer to disk and returns generated filename', async () => {
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    const buffer = Buffer.from('test image data');
    const result = await saveFile('trade-123', buffer, 'png');
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/data/screenshots/trade-123/mock-file-id.png',
      buffer,
    );
    expect(result).toBe('mock-file-id.png');
  });

  it('calls ensureTradeDir before writing', async () => {
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    await saveFile('trade-abc', Buffer.from('x'), 'jpg');
    expect(mockMkdir).toHaveBeenCalledWith('/data/screenshots/trade-abc', { recursive: true });
  });
});

describe('readFileFromDisk', () => {
  afterEach(() => vi.clearAllMocks());

  it('reads and returns the file buffer', async () => {
    const buf = Buffer.from('file content');
    mockReadFile.mockResolvedValue(buf);
    const result = await readFileFromDisk('trade-123', 'shot.png');
    expect(mockReadFile).toHaveBeenCalledWith('/data/screenshots/trade-123/shot.png');
    expect(result).toEqual(buf);
  });

  it('strips directory traversal from filename (path traversal defense)', async () => {
    const buf = Buffer.from('safe');
    mockReadFile.mockResolvedValue(buf);
    await readFileFromDisk('trade-123', '../../../etc/passwd');
    // path.basename strips the directory portion, leaving only 'passwd'
    expect(mockReadFile).toHaveBeenCalledWith('/data/screenshots/trade-123/passwd');
  });
});

describe('deleteFile', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls unlink with the correct path on success', async () => {
    mockUnlink.mockResolvedValue(undefined);
    await deleteFile('trade-123', 'shot.png');
    expect(mockUnlink).toHaveBeenCalledWith('/data/screenshots/trade-123/shot.png');
  });

  it('does not throw when unlink fails (logs warning instead)', async () => {
    mockUnlink.mockRejectedValue(new Error('ENOENT: no such file'));
    await expect(deleteFile('trade-123', 'missing.png')).resolves.toBeUndefined();
  });
});

describe('deleteTradeScreenshotDir', () => {
  afterEach(() => vi.clearAllMocks());

  it('recursively removes the trade directory with force option', async () => {
    mockRm.mockResolvedValue(undefined);
    await deleteTradeScreenshotDir('trade-123');
    expect(mockRm).toHaveBeenCalledWith('/data/screenshots/trade-123', {
      recursive: true,
      force: true,
    });
  });

  it('does not throw when rm fails (logs warning instead)', async () => {
    mockRm.mockRejectedValue(new Error('Permission denied'));
    await expect(deleteTradeScreenshotDir('trade-123')).resolves.toBeUndefined();
  });
});
