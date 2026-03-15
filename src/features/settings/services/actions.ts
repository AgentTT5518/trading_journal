'use server';

import { db } from '@/lib/db';
import { settings, trades } from '@/lib/db/schema';
import { generateId } from '@/lib/ids';
import { revalidatePath } from 'next/cache';
import { settingsSchema, importedTradeSchema } from '../validations';
import { log } from '../logger';
import type { ActionState, ImportResult } from '../types';

// ─── Settings Upsert ──────────────────────────────────────────────────────────

export async function updateSettings(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const raw = Object.fromEntries(formData.entries());

    const parsed = settingsSchema.safeParse({
      traderName: raw.traderName || '',
      timezone: raw.timezone || 'America/New_York',
      currency: raw.currency || 'USD',
      startingCapital: raw.startingCapital ? Number(raw.startingCapital) : null,
      defaultCommission: raw.defaultCommission ? Number(raw.defaultCommission) : 0,
      defaultRiskPercent: raw.defaultRiskPercent ? Number(raw.defaultRiskPercent) : 1,
      positionSizingMethod: raw.positionSizingMethod || 'fixed-dollar',
      dateFormat: raw.dateFormat || 'MM/DD/YYYY',
      theme: raw.theme || 'system',
    });

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      }
      return { success: false, message: 'Validation failed', errors };
    }

    const now = new Date().toISOString();

    await db
      .insert(settings)
      .values({ id: 'default', ...parsed.data, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: settings.id,
        set: { ...parsed.data, updatedAt: now },
      });

    log.info('Settings updated', { theme: parsed.data.theme });
    revalidatePath('/settings');
    return { success: true, message: 'Settings saved' };
  } catch (error) {
    log.error('Failed to update settings', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export async function importTradesFromCsv(
  _prevState: ActionState<ImportResult>,
  formData: FormData
): Promise<ActionState<ImportResult>> {
  try {
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return { success: false, message: 'No file provided' };
    }

    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    if (lines.length < 2) {
      return { success: false, message: 'CSV must have a header row and at least one data row' };
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] ?? '';
      });

      const parsed = importedTradeSchema.safeParse({
        ticker: obj.ticker,
        assetClass: obj.assetClass || obj.asset_class,
        direction: obj.direction,
        entryDate: obj.entryDate || obj.entry_date,
        entryPrice: obj.entryPrice || obj.entry_price,
        positionSize: obj.positionSize || obj.position_size,
        exitDate: obj.exitDate || obj.exit_date || null,
        exitPrice: obj.exitPrice || obj.exit_price || null,
        commissions: obj.commissions || 0,
        fees: obj.fees || 0,
        notes: obj.notes || null,
      });

      if (!parsed.success) {
        result.errors.push({ row: rowNum, message: parsed.error.issues.map((e) => e.message).join('; ') });
        result.skipped++;
        continue;
      }

      try {
        const id = generateId();
        const now = new Date().toISOString();
        await db.insert(trades).values({
          id,
          ...parsed.data,
          exitDate: parsed.data.exitDate ?? null,
          exitPrice: parsed.data.exitPrice ?? null,
          commissions: parsed.data.commissions ?? 0,
          fees: parsed.data.fees ?? null,
          notes: parsed.data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        });
        result.imported++;
      } catch (insertError) {
        log.error('Failed to insert imported trade row', insertError as Error, { row: rowNum });
        result.errors.push({ row: rowNum, message: 'Database insert failed' });
        result.skipped++;
      }
    }

    log.info('CSV import complete', { imported: result.imported, skipped: result.skipped });
    revalidatePath('/trades');
    return { success: true, message: `Imported ${result.imported} trades`, data: result };
  } catch (error) {
    log.error('Failed to import trades from CSV', error as Error);
    return { success: false, message: 'An unexpected error occurred during import' };
  }
}

// ─── Clear All Trades ─────────────────────────────────────────────────────────

export async function clearAllTrades(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const confirmation = formData.get('confirmation') as string;
    if (confirmation !== 'DELETE') {
      return { success: false, message: 'Type DELETE to confirm' };
    }

    await db.delete(trades);
    log.info('All trades cleared');
    revalidatePath('/trades');
    revalidatePath('/dashboard');
    return { success: true, message: 'All trades have been deleted' };
  } catch (error) {
    log.error('Failed to clear all trades', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}
