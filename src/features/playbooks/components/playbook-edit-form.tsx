'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagSelector } from './tag-selector';
import { updatePlaybook } from '../services/actions';
import type { ActionState } from '@/features/trades/types';
import type { Tag, PlaybookWithTags } from '../types';

interface PlaybookEditFormProps {
  playbook: PlaybookWithTags;
  tags: Tag[];
}

export function PlaybookEditForm({ playbook, tags }: PlaybookEditFormProps) {
  const router = useRouter();
  const boundUpdate = updatePlaybook.bind(null, playbook.id);
  const [state, formAction, isPending] = useActionState<ActionState<{ id: string }>, FormData>(
    boundUpdate,
    { success: false, message: '' }
  );

  useEffect(() => {
    if (state.success && state.data?.id) {
      toast.success('Playbook updated');
      router.push(`/playbooks/${state.data.id}`);
    }
  }, [state, router]);

  const linkedTagIds = playbook.tags.map((t) => t.id);

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.success && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Playbook Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required maxLength={200} defaultValue={playbook.name} />
            {state.errors?.name && (
              <p className="mt-1 text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={playbook.description ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="entryRules">Entry Rules</Label>
            <Textarea id="entryRules" name="entryRules" rows={4} defaultValue={playbook.entryRules ?? ''} />
          </div>

          <div>
            <Label htmlFor="exitRules">Exit Rules</Label>
            <Textarea id="exitRules" name="exitRules" rows={4} defaultValue={playbook.exitRules ?? ''} />
          </div>

          <div>
            <Label htmlFor="marketConditions">Market Conditions</Label>
            <Textarea id="marketConditions" name="marketConditions" rows={3} defaultValue={playbook.marketConditions ?? ''} />
          </div>

          <div>
            <Label htmlFor="positionSizingRules">Position Sizing Rules</Label>
            <Textarea id="positionSizingRules" name="positionSizingRules" rows={3} defaultValue={playbook.positionSizingRules ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Select tags to associate with this playbook. Trades using these tags will be linked to this playbook for metrics.
          </p>
          <TagSelector tags={tags} selectedTagIds={linkedTagIds} name="tagIds" />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
