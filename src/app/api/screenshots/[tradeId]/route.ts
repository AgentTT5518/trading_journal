import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { screenshots } from '@/lib/db/schema';
import { generateId } from '@/lib/ids';
import { validateFile } from '@/features/screenshots/validations';
import { saveFile, getExtension } from '@/features/screenshots/services/storage';
import { log } from '@/features/screenshots/logger';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  const { tradeId } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = getExtension(file.type);
    const filename = await saveFile(tradeId, buffer, ext);

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(screenshots).values({
      id,
      tradeId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      createdAt: now,
    });

    log.info('Screenshot uploaded', { screenshotId: id, tradeId, filename });
    revalidatePath(`/trades/${tradeId}`);

    return NextResponse.json({ id, filename }, { status: 201 });
  } catch (error) {
    log.error('Screenshot upload failed', error as Error, { tradeId });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
