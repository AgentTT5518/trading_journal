'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { PlaybookRule, RuleType } from '../types';
import type { Tag } from '@/features/playbooks/types';

const ruleTypeLabels: Record<RuleType, string> = {
  entry: 'Entry Rules',
  exit: 'Exit Rules',
  sizing: 'Sizing Rules',
};

const ruleTypeColors: Record<RuleType, string> = {
  entry: 'text-emerald-600 dark:text-emerald-400',
  exit: 'text-red-600 dark:text-red-400',
  sizing: 'text-blue-600 dark:text-blue-400',
};

interface TradeRulesTabProps {
  /** All rules grouped by playbook ID */
  rulesByPlaybook: Record<string, PlaybookRule[]>;
  /** All tags (to map tag → playbook) */
  tags: Tag[];
  /** IDs of tags currently selected on the trade (from TagSelector) */
  selectedTagIds: string[];
  /** Rule IDs that were previously checked (for editing existing trades) */
  initialCheckedRuleIds?: string[];
}

export function TradeRulesTab({
  rulesByPlaybook,
  tags,
  selectedTagIds,
  initialCheckedRuleIds = [],
}: TradeRulesTabProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(initialCheckedRuleIds));

  // Derive which playbooks are linked via selected tags
  const linkedPlaybookIds = new Set(
    tags
      .filter((t) => selectedTagIds.includes(t.id) && t.playbookId)
      .map((t) => t.playbookId!)
  );

  // Get relevant rules
  const relevantRules: PlaybookRule[] = [];
  for (const pbId of linkedPlaybookIds) {
    const rules = rulesByPlaybook[pbId];
    if (rules) relevantRules.push(...rules);
  }

  const handleToggle = useCallback((ruleId: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(ruleId);
      else next.delete(ruleId);
      return next;
    });
  }, []);

  if (Object.keys(rulesByPlaybook).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rule Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No structured rules defined. Add rules to your playbooks to see a checklist here.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (relevantRules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rule Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select tags linked to a playbook (on the Tags tab) to see its rule checklist here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by type
  const grouped: Record<RuleType, PlaybookRule[]> = { entry: [], exit: [], sizing: [] };
  for (const rule of relevantRules) {
    grouped[rule.ruleType as RuleType].push(rule);
  }

  const followedCount = relevantRules.filter((r) => checkedIds.has(r.id)).length;
  const score = relevantRules.length > 0 ? Math.round((followedCount / relevantRules.length) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rule Checklist</CardTitle>
          <span className="text-sm text-muted-foreground">
            {followedCount}/{relevantRules.length} ({score}%)
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden inputs for FormData */}
        {Array.from(checkedIds).map((id) => (
          <input key={id} type="hidden" name="ruleChecks" value={id} />
        ))}

        {(['entry', 'exit', 'sizing'] as const).map((type) => {
          const typeRules = grouped[type];
          if (typeRules.length === 0) return null;
          return (
            <div key={type}>
              <p className={`mb-2 text-xs font-medium uppercase tracking-wider ${ruleTypeColors[type]}`}>
                {ruleTypeLabels[type]}
              </p>
              <div className="space-y-2">
                {typeRules.map((rule) => (
                  <div key={rule.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`rule-${rule.id}`}
                      checked={checkedIds.has(rule.id)}
                      onCheckedChange={(checked) => handleToggle(rule.id, checked === true)}
                    />
                    <Label htmlFor={`rule-${rule.id}`} className="text-sm leading-5 font-normal">
                      {rule.ruleText}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
