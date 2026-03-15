import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trades } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { log } from '@/features/settings/logger';

export async function GET() {
  try {
    const rows = await db.select().from(trades).orderBy(desc(trades.entryDate));

    if (rows.length === 0) {
      const csv = 'No trades found\n';
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="trades.csv"',
        },
      });
    }

    const headers = Object.keys(rows[0]) as (keyof (typeof rows)[0])[];
    const escape = (v: unknown): string => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const lines = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ];
    const csv = lines.join('\n') + '\n';

    log.info('CSV export generated', { tradeCount: rows.length });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="trades.csv"',
      },
    });
  } catch (error) {
    log.error('CSV export failed', error as Error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
