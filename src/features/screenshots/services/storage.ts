import { mkdir, writeFile, unlink, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { APP_CONFIG } from '@/lib/config';
import { generateId } from '@/lib/ids';
import { log } from '../logger';

function getTradeDir(tradeId: string): string {
  return path.join(APP_CONFIG.screenshotDir, tradeId);
}

function getFilePath(tradeId: string, filename: string): string {
  // Path traversal defense
  const base = path.basename(filename);
  return path.join(getTradeDir(tradeId), base);
}

export async function ensureTradeDir(tradeId: string): Promise<string> {
  const dir = getTradeDir(tradeId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function saveFile(
  tradeId: string,
  buffer: Buffer,
  ext: string
): Promise<string> {
  await ensureTradeDir(tradeId);
  const filename = `${generateId()}.${ext}`;
  const filePath = getFilePath(tradeId, filename);
  await writeFile(filePath, buffer);
  log.info('Screenshot saved', { tradeId, filename, size: buffer.length });
  return filename;
}

export async function readFileFromDisk(
  tradeId: string,
  filename: string
): Promise<Buffer> {
  const filePath = getFilePath(tradeId, filename);
  return readFile(filePath);
}

export async function deleteFile(tradeId: string, filename: string): Promise<void> {
  try {
    const filePath = getFilePath(tradeId, filename);
    await unlink(filePath);
    log.info('Screenshot file deleted', { tradeId, filename });
  } catch (error) {
    log.warn('Failed to delete screenshot file', { tradeId, filename, error: (error as Error).message });
  }
}

export async function deleteTradeScreenshotDir(tradeId: string): Promise<void> {
  try {
    const dir = getTradeDir(tradeId);
    await rm(dir, { recursive: true, force: true });
    log.info('Trade screenshot directory deleted', { tradeId });
  } catch (error) {
    log.warn('Failed to delete trade screenshot directory', { tradeId, error: (error as Error).message });
  }
}

export function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? 'bin';
}

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(1);
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return map[ext] ?? 'application/octet-stream';
}
