'use server';

import { db } from '@/lib/db';
import { playbookRules, tradeRuleChecks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/ids';
import { revalidatePath } from 'next/cache';
import { log } from '../logger';
import type { ActionState } from '@/features/trades/types';
import type { RuleCheckState } from '../types';

/** Create a new playbook rule */
export async function createPlaybookRule(
  playbookId: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const ruleText = formData.get('ruleText') as string;
    const ruleType = formData.get('ruleType') as string;
    const sortOrder = Number(formData.get('sortOrder') ?? 0);

    if (!ruleText?.trim()) {
      return { success: false, message: 'Rule text is required' };
    }
    if (!['entry', 'exit', 'sizing'].includes(ruleType)) {
      return { success: false, message: 'Invalid rule type' };
    }

    const id = generateId();
    await db.insert(playbookRules).values({
      id,
      playbookId,
      ruleText: ruleText.trim(),
      ruleType: ruleType as 'entry' | 'exit' | 'sizing',
      sortOrder,
      createdAt: new Date().toISOString(),
    });

    log.info('Playbook rule created', { id, playbookId, ruleType });
    revalidatePath(`/playbooks/${playbookId}`);
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to create playbook rule', error as Error, { playbookId });
    return { success: false, message: 'Failed to create rule' };
  }
}

/** Update a playbook rule */
export async function updatePlaybookRule(
  ruleId: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const ruleText = formData.get('ruleText') as string;
    const ruleType = formData.get('ruleType') as string;
    const sortOrder = Number(formData.get('sortOrder') ?? 0);

    if (!ruleText?.trim()) {
      return { success: false, message: 'Rule text is required' };
    }

    await db
      .update(playbookRules)
      .set({
        ruleText: ruleText.trim(),
        ...(ruleType && { ruleType: ruleType as 'entry' | 'exit' | 'sizing' }),
        sortOrder,
      })
      .where(eq(playbookRules.id, ruleId));

    log.info('Playbook rule updated', { ruleId });
    return { success: true, data: { id: ruleId } };
  } catch (error) {
    log.error('Failed to update playbook rule', error as Error, { ruleId });
    return { success: false, message: 'Failed to update rule' };
  }
}

/** Delete a playbook rule */
export async function deletePlaybookRule(ruleId: string): Promise<ActionState<void>> {
  try {
    await db.delete(playbookRules).where(eq(playbookRules.id, ruleId));
    log.info('Playbook rule deleted', { ruleId });
    return { success: true };
  } catch (error) {
    log.error('Failed to delete playbook rule', error as Error, { ruleId });
    return { success: false, message: 'Failed to delete rule' };
  }
}

/** Save rule check states for a trade (upsert pattern) */
export async function saveTradeRuleChecks(
  tradeId: string,
  checks: RuleCheckState[]
): Promise<ActionState<void>> {
  try {
    // Delete existing checks for this trade
    await db.delete(tradeRuleChecks).where(eq(tradeRuleChecks.tradeId, tradeId));

    // Insert new checks
    if (checks.length > 0) {
      await db.insert(tradeRuleChecks).values(
        checks.map((check) => ({
          id: generateId(),
          tradeId,
          ruleId: check.ruleId,
          followed: check.followed,
          createdAt: new Date().toISOString(),
        }))
      );
    }

    log.info('Trade rule checks saved', { tradeId, checkCount: checks.length });
    revalidatePath(`/trades/${tradeId}`);
    revalidatePath('/analytics');
    return { success: true };
  } catch (error) {
    log.error('Failed to save trade rule checks', error as Error, { tradeId });
    return { success: false, message: 'Failed to save rule checks' };
  }
}
