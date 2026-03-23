'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPlaybookRule, deletePlaybookRule } from '../services/actions';
import type { PlaybookRule, RuleType } from '../types';
import type { ActionState } from '@/features/trades/types';

const ruleTypeLabels: Record<RuleType, string> = {
  entry: 'Entry',
  exit: 'Exit',
  sizing: 'Sizing',
};

const ruleTypeColors: Record<RuleType, string> = {
  entry: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  exit: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  sizing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

interface RuleManagerProps {
  playbookId: string;
  rules: PlaybookRule[];
}

export function RuleManager({ playbookId, rules }: RuleManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleType, setNewRuleType] = useState<RuleType>('entry');

  const groupedRules = {
    entry: rules.filter((r) => r.ruleType === 'entry'),
    exit: rules.filter((r) => r.ruleType === 'exit'),
    sizing: rules.filter((r) => r.ruleType === 'sizing'),
  };

  function handleAddRule() {
    if (!newRuleText.trim()) return;

    const formData = new FormData();
    formData.set('ruleText', newRuleText.trim());
    formData.set('ruleType', newRuleType);
    formData.set('sortOrder', String(rules.filter((r) => r.ruleType === newRuleType).length));

    startTransition(async () => {
      const result = await createPlaybookRule(
        playbookId,
        { success: false } as ActionState<{ id: string }>,
        formData
      );
      if (result.success) {
        toast.success('Rule added');
        setNewRuleText('');
      } else {
        toast.error(result.message ?? 'Failed to add rule');
      }
    });
  }

  function handleDeleteRule(ruleId: string) {
    startTransition(async () => {
      const result = await deletePlaybookRule(ruleId);
      if (result.success) {
        toast.success('Rule deleted');
      } else {
        toast.error(result.message ?? 'Failed to delete rule');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Structured Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add specific rules that can be checked per trade. These appear as a checklist when logging trades with this playbook.
        </p>

        {/* Add new rule */}
        <div className="flex gap-2">
          <Select value={newRuleType} onValueChange={(v) => setNewRuleType(v as RuleType)}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry</SelectItem>
              <SelectItem value="exit">Exit</SelectItem>
              <SelectItem value="sizing">Sizing</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Enter rule text..."
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRule();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRule}
            disabled={isPending || !newRuleText.trim()}
          >
            Add
          </Button>
        </div>

        {/* Rule list by type */}
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No structured rules yet.</p>
        ) : (
          <div className="space-y-3">
            {(['entry', 'exit', 'sizing'] as const).map((type) => {
              const typeRules = groupedRules[type];
              if (typeRules.length === 0) return null;
              return (
                <div key={type}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {ruleTypeLabels[type]} Rules
                  </p>
                  <ul className="space-y-1">
                    {typeRules.map((rule) => (
                      <li
                        key={rule.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ruleTypeColors[type]}`}
                          >
                            {ruleTypeLabels[type]}
                          </span>
                          <span>{rule.ruleText}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          disabled={isPending}
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
