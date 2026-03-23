'use server';

import { db } from '@/lib/db';
import { trades, exitLegs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/ids';
import { tradeInsertSchema, exitLegInsertSchema } from '../validations';
import { syncTradeTags } from '@/features/playbooks/services/actions';
import { deleteTradeScreenshotDir } from '@/features/screenshots/services/storage';
import { saveTradeRuleChecks } from '@/features/rule-adherence/services/actions';
import { log } from '../logger';
import type { ActionState } from '../types';
import { revalidatePath } from 'next/cache';

/** Parse FormData into the shape tradeInsertSchema expects */
function parseTradeFormData(raw: Record<string, FormDataEntryValue>) {
  // Use strict empty/undefined check so that "0" is preserved as 0, not dropped to undefined.
  const num = (key: string) => {
    const v = raw[key];
    return v !== undefined && v !== '' ? Number(v) : undefined;
  };
  const str = (key: string) => raw[key] || undefined;
  const nullable = (key: string) => raw[key] || undefined;
  const bool = (key: string) => raw[key] === 'on' || raw[key] === 'true' ? true : false;

  return {
    // Core
    assetClass: str('assetClass'),
    ticker: str('ticker'),
    direction: str('direction'),
    entryDate: str('entryDate'),
    entryPrice: num('entryPrice'),
    positionSize: num('positionSize'),
    orderType: str('orderType'),
    entryTrigger: str('entryTrigger'),
    // Exit
    exitDate: nullable('exitDate'),
    exitPrice: num('exitPrice'),
    exitReason: nullable('exitReason'),
    // Risk parameters
    plannedStopLoss: num('plannedStopLoss'),
    plannedTarget1: num('plannedTarget1'),
    invalidationLevel: num('invalidationLevel'),
    riskRewardPlanned: num('riskRewardPlanned'),
    // Fees
    commissions: num('commissions') ?? 0,
    fees: num('fees') ?? 0,
    notes: str('notes'),
    // Options
    optionType: nullable('optionType'),
    strike: num('strike'),
    expiry: nullable('expiry'),
    contracts: num('contracts'),
    contractMultiplier: num('contractMultiplier') ?? 100,
    delta: num('delta'),
    gamma: num('gamma'),
    theta: num('theta'),
    vega: num('vega'),
    iv: num('iv'),
    ivRank: num('ivRank'),
    spreadId: nullable('spreadId'),
    spreadType: nullable('spreadType'),
    // Crypto
    exchange: nullable('exchange'),
    tradingPair: nullable('tradingPair'),
    makerFee: num('makerFee'),
    takerFee: num('takerFee'),
    networkFee: num('networkFee'),
    fundingRate: num('fundingRate'),
    leverage: num('leverage'),
    liquidationPrice: num('liquidationPrice'),
    marketCapCategory: nullable('marketCapCategory'),
    tokenType: nullable('tokenType'),
    btcDominance: num('btcDominance'),
    btcCorrelation: num('btcCorrelation'),
    // Swing context (Phase 5)
    plannedHoldDays: num('plannedHoldDays'),
    heldOverWeekend: bool('heldOverWeekend'),
    heldThroughEarnings: bool('heldThroughEarnings'),
    heldThroughMacro: bool('heldThroughMacro'),
    // Market context (Phase 5)
    weeklyTrend: nullable('weeklyTrend'),
    marketRegime: nullable('marketRegime'),
    vixLevel: num('vixLevel'),
    supportLevel: num('supportLevel'),
    resistanceLevel: num('resistanceLevel'),
    sectorPerformance: str('sectorPerformance'),
    upcomingCatalysts: str('upcomingCatalysts'),
    // Technical context (Phase 5)
    rsiAtEntry: num('rsiAtEntry'),
    macdAtEntry: str('macdAtEntry'),
    distanceFrom50ma: num('distanceFrom50ma'),
    distanceFrom200ma: num('distanceFrom200ma'),
    volumeProfile: nullable('volumeProfile'),
    atrAtEntry: num('atrAtEntry'),
    // Psychology (Phase 4)
    preMood: num('preMood'),
    preConfidence: num('preConfidence'),
    fomoFlag: bool('fomoFlag'),
    revengeFlag: bool('revengeFlag'),
    anxietyDuring: num('anxietyDuring'),
    urgeToExitEarly: bool('urgeToExitEarly'),
    urgeToAdd: bool('urgeToAdd'),
    executionSatisfaction: num('executionSatisfaction'),
    lessonsLearned: str('lessonsLearned'),
    tradeGrade: nullable('tradeGrade'),
  };
}

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export async function createTrade(
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = tradeInsertSchema.safeParse(parseTradeFormData(raw));

    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: collectFieldErrors(parsed.error.issues),
      };
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(trades).values({
      id,
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    });

    // Sync tags from form
    const tagIds = formData.getAll('tagIds').map(String).filter(Boolean);
    if (tagIds.length > 0) {
      await syncTradeTags(id, tagIds);
    }

    // Save rule checks from form
    const ruleCheckIds = formData.getAll('ruleChecks').map(String).filter(Boolean);
    if (ruleCheckIds.length > 0) {
      await saveTradeRuleChecks(
        id,
        ruleCheckIds.map((ruleId) => ({ ruleId, followed: true }))
      );
    }

    log.info('Trade created', { tradeId: id, ticker: parsed.data.ticker });
    revalidatePath('/trades');
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to create trade', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updateTrade(
  id: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = tradeInsertSchema.safeParse(parseTradeFormData(raw));

    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: collectFieldErrors(parsed.error.issues),
      };
    }

    const now = new Date().toISOString();
    await db
      .update(trades)
      .set({ ...parsed.data, updatedAt: now })
      .where(eq(trades.id, id));

    // Sync tags from form
    const tagIds = formData.getAll('tagIds').map(String).filter(Boolean);
    await syncTradeTags(id, tagIds);

    // Save rule checks from form (all checked rules are "followed", unchecked are absent)
    const ruleCheckIds = formData.getAll('ruleChecks').map(String).filter(Boolean);
    await saveTradeRuleChecks(
      id,
      ruleCheckIds.map((ruleId) => ({ ruleId, followed: true }))
    );

    log.info('Trade updated', { tradeId: id, ticker: parsed.data.ticker });
    revalidatePath('/trades');
    revalidatePath(`/trades/${id}`);
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to update trade', error as Error, { tradeId: id });
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function deleteTrade(id: string): Promise<ActionState> {
  try {
    await db.delete(trades).where(eq(trades.id, id));
    // Best-effort cleanup of screenshot files
    await deleteTradeScreenshotDir(id);
    log.info('Trade deleted', { tradeId: id });
    revalidatePath('/trades');
    return { success: true };
  } catch (error) {
    log.error('Failed to delete trade', error as Error, { tradeId: id });
    return { success: false, message: 'Failed to delete trade' };
  }
}

// ─── Exit Leg Actions ─────────────────────────────────────────────────────────

export async function addExitLeg(
  tradeId: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = exitLegInsertSchema.safeParse({
      exitDate: raw.exitDate || undefined,
      exitPrice: raw.exitPrice ? Number(raw.exitPrice) : undefined,
      quantity: raw.quantity ? Number(raw.quantity) : undefined,
      exitReason: raw.exitReason || undefined,
      fees: raw.fees ? Number(raw.fees) : 0,
      notes: raw.notes || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: collectFieldErrors(parsed.error.issues),
      };
    }

    // Validate that quantity does not exceed remaining position
    const trade = await db.query.trades.findFirst({ where: eq(trades.id, tradeId) });
    if (!trade) {
      return { success: false, message: 'Trade not found' };
    }

    const existingLegs = await db.query.exitLegs.findMany({
      where: eq(exitLegs.tradeId, tradeId),
    });
    const alreadyExited = existingLegs.reduce((s, l) => s + l.quantity, 0);
    const remaining = trade.positionSize - alreadyExited;

    if (parsed.data.quantity > remaining) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { quantity: [`Quantity exceeds remaining position (${remaining})`] },
      };
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(exitLegs).values({
      id,
      tradeId,
      ...parsed.data,
      createdAt: now,
    });

    log.info('Exit leg added', { legId: id, tradeId });
    revalidatePath('/trades');
    revalidatePath(`/trades/${tradeId}`);
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to add exit leg', error as Error, { tradeId });
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updateExitLeg(
  legId: string,
  tradeId: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = exitLegInsertSchema.safeParse({
      exitDate: raw.exitDate || undefined,
      exitPrice: raw.exitPrice ? Number(raw.exitPrice) : undefined,
      quantity: raw.quantity ? Number(raw.quantity) : undefined,
      exitReason: raw.exitReason || undefined,
      fees: raw.fees ? Number(raw.fees) : 0,
      notes: raw.notes || undefined,
    });

    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: collectFieldErrors(parsed.error.issues),
      };
    }

    // Validate quantity doesn't exceed remaining (excluding this leg's current quantity)
    const trade = await db.query.trades.findFirst({ where: eq(trades.id, tradeId) });
    if (!trade) return { success: false, message: 'Trade not found' };

    const existingLegs = await db.query.exitLegs.findMany({
      where: eq(exitLegs.tradeId, tradeId),
    });
    const otherLegsTotal = existingLegs
      .filter((l) => l.id !== legId)
      .reduce((s, l) => s + l.quantity, 0);
    const remaining = trade.positionSize - otherLegsTotal;

    if (parsed.data.quantity > remaining) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { quantity: [`Quantity exceeds remaining position (${remaining})`] },
      };
    }

    await db.update(exitLegs).set(parsed.data).where(eq(exitLegs.id, legId));

    log.info('Exit leg updated', { legId, tradeId });
    revalidatePath('/trades');
    revalidatePath(`/trades/${tradeId}`);
    return { success: true, data: { id: legId } };
  } catch (error) {
    log.error('Failed to update exit leg', error as Error, { legId, tradeId });
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function deleteExitLeg(legId: string, tradeId: string): Promise<ActionState> {
  try {
    await db.delete(exitLegs).where(eq(exitLegs.id, legId));
    log.info('Exit leg deleted', { legId, tradeId });
    revalidatePath('/trades');
    revalidatePath(`/trades/${tradeId}`);
    return { success: true };
  } catch (error) {
    log.error('Failed to delete exit leg', error as Error, { legId, tradeId });
    return { success: false, message: 'Failed to delete exit leg' };
  }
}
