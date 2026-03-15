import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { log } from '@/features/settings/logger';

export async function GET() {
  try {
    const rows = await db.select().from(trades).orderBy(desc(trades.entryDate));

    const json = JSON.stringify(rows, null, 2);

    log.info('JSON export generated', { tradeCount: rows.length });

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="trades.json"',
      },
    });
  } catch (error) {
    log.error('JSON export failed', error as Error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
