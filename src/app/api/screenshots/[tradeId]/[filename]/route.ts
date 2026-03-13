import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { readFileFromDisk, getMimeType } from '@/features/screenshots/services/storage';
import { log } from '@/features/screenshots/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tradeId: string; filename: string }> }
) {
  const { tradeId, filename } = await params;

  // Path traversal defense
  if (path.basename(filename) !== filename) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  try {
    const buffer = await readFileFromDisk(tradeId, filename);
    const mimeType = getMimeType(filename);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    log.error('Screenshot serve failed', error as Error, { tradeId, filename });
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
