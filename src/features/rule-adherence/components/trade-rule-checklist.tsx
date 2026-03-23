'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlaybookRule, RuleType } from '../types';

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

interface TradeRuleChecklistProps {
  rules: PlaybookRule[];
  checkedRuleIds: Set<string>;
  onToggle: (ruleId: string, checked: boolean) => void;
}

export function TradeRuleChecklist({ rules, checkedRuleIds, onToggle }: TradeRuleChecklistProps) {
  if (rules.length === 0) return null;

  const grouped: Record<RuleType, PlaybookRule[]> = {
    entry: rules.filter((r) => r.ruleType === 'entry'),
    exit: rules.filter((r) => r.ruleType === 'exit'),
    sizing: rules.filter((r) => r.ruleType === 'sizing'),
  };

  const followedCount = rules.filter((r) => checkedRuleIds.has(r.id)).length;
  const score = rules.length > 0 ? Math.round((followedCount / rules.length) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rule Checklist</CardTitle>
          <span className="text-sm text-muted-foreground">
            {followedCount}/{rules.length} followed ({score}%)
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
                      checked={checkedRuleIds.has(rule.id)}
                      onCheckedChange={(checked) => onToggle(rule.id, checked === true)}
                    />
                    <Label htmlFor={`rule-${rule.id}`} className="text-sm leading-5">
                      {rule.ruleText}
                    </Label>
                    {/* Hidden inputs to include in FormData */}
                    {checkedRuleIds.has(rule.id) && (
                      <input type="hidden" name="ruleChecks" value={rule.id} />
                    )}
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
