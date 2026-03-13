'use server';

import { db } from '@/lib/db';
import { tags, tradeTags, playbooks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/ids';
import { tagInsertSchema, playbookInsertSchema } from '../validations';
import { log } from '../logger';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@/features/trades/types';

export async function createTag(
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
    };

    const parsed = tagInsertSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      }
      return { success: false, message: 'Validation failed', errors };
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(tags).values({
      id,
      name: parsed.data.name,
      category: parsed.data.category,
      isCustom: true,
      createdAt: now,
    });

    log.info('Tag created', { tagId: id, name: parsed.data.name });
    revalidatePath('/tags');
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to create tag', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function deleteTag(id: string): Promise<ActionState> {
  try {
    await db.delete(tags).where(eq(tags.id, id));
    log.info('Tag deleted', { tagId: id });
    revalidatePath('/tags');
    return { success: true };
  } catch (error) {
    log.error('Failed to delete tag', error as Error, { tagId: id });
    return { success: false, message: 'Failed to delete tag' };
  }
}

export async function syncTradeTags(
  tradeId: string,
  tagIds: string[]
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Delete all existing trade tags for this trade
      await tx.delete(tradeTags).where(eq(tradeTags.tradeId, tradeId));

      // Insert new trade tags
      if (tagIds.length > 0) {
        const now = new Date().toISOString();
        await tx.insert(tradeTags).values(
          tagIds.map((tagId) => ({
            id: generateId(),
            tradeId,
            tagId,
            createdAt: now,
          }))
        );
      }
    });

    log.info('Trade tags synced', { tradeId, tagCount: tagIds.length });
    revalidatePath('/trades');
    revalidatePath(`/trades/${tradeId}`);
  } catch (error) {
    log.error('Failed to sync trade tags', error as Error, { tradeId });
    throw error;
  }
}

// ─── Playbook Actions ────────────────────────────────────────────────────────

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export async function createPlaybook(
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      entryRules: (formData.get('entryRules') as string) || undefined,
      exitRules: (formData.get('exitRules') as string) || undefined,
      marketConditions: (formData.get('marketConditions') as string) || undefined,
      positionSizingRules: (formData.get('positionSizingRules') as string) || undefined,
    };

    const parsed = playbookInsertSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: 'Validation failed', errors: collectFieldErrors(parsed.error.issues) };
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(playbooks).values({
      id,
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    });

    // Link selected tags to this playbook
    const tagIds = formData.getAll('tagIds').map(String).filter(Boolean);
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await db.update(tags).set({ playbookId: id }).where(eq(tags.id, tagId));
      }
    }

    log.info('Playbook created', { playbookId: id, name: parsed.data.name });
    revalidatePath('/playbooks');
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to create playbook', error as Error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function updatePlaybook(
  id: string,
  _prevState: ActionState<{ id: string }>,
  formData: FormData
): Promise<ActionState<{ id: string }>> {
  try {
    const raw = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      entryRules: (formData.get('entryRules') as string) || undefined,
      exitRules: (formData.get('exitRules') as string) || undefined,
      marketConditions: (formData.get('marketConditions') as string) || undefined,
      positionSizingRules: (formData.get('positionSizingRules') as string) || undefined,
    };

    const parsed = playbookInsertSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, message: 'Validation failed', errors: collectFieldErrors(parsed.error.issues) };
    }

    const now = new Date().toISOString();
    await db.update(playbooks).set({ ...parsed.data, updatedAt: now }).where(eq(playbooks.id, id));

    // Re-link tags: clear old links, set new ones
    await db.update(tags).set({ playbookId: null }).where(eq(tags.playbookId, id));
    const tagIds = formData.getAll('tagIds').map(String).filter(Boolean);
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await db.update(tags).set({ playbookId: id }).where(eq(tags.id, tagId));
      }
    }

    log.info('Playbook updated', { playbookId: id });
    revalidatePath('/playbooks');
    revalidatePath(`/playbooks/${id}`);
    return { success: true, data: { id } };
  } catch (error) {
    log.error('Failed to update playbook', error as Error, { playbookId: id });
    return { success: false, message: 'An unexpected error occurred' };
  }
}

export async function deletePlaybook(id: string): Promise<ActionState> {
  try {
    // Tags will have playbookId set to null via onDelete: 'set null'
    await db.delete(playbooks).where(eq(playbooks.id, id));
    log.info('Playbook deleted', { playbookId: id });
    revalidatePath('/playbooks');
    return { success: true };
  } catch (error) {
    log.error('Failed to delete playbook', error as Error, { playbookId: id });
    return { success: false, message: 'Failed to delete playbook' };
  }
}
