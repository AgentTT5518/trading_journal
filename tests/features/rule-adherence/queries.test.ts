import { describe, it, expect, vi } from 'vitest';

// Mock DB
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/features/trades/services/queries', () => ({
  getTrades: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/features/playbooks/services/queries', () => ({
  getPlaybooks: vi.fn().mockResolvedValue([]),
}));

import { computeAdherenceScore } from '@/features/rule-adherence/services/queries';
import type { PlaybookRule, TradeRuleCheck } from '@/features/rule-adherence/types';

function makeRule(overrides: Partial<PlaybookRule> = {}): PlaybookRule {
  return {
    id: 'rule-1',
    playbookId: 'pb-1',
    ruleText: 'Wait for confirmation candle',
    ruleType: 'entry',
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCheck(overrides: Partial<TradeRuleCheck> = {}): TradeRuleCheck {
  return {
    id: 'check-1',
    tradeId: 'trade-1',
    ruleId: 'rule-1',
    followed: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────
// computeAdherenceScore
// ────────────────────────────────────────────────────────
describe('computeAdherenceScore', () => {
  it('computes 100% when all rules are followed', () => {
    const rules = [
      makeRule({ id: 'r1', ruleType: 'entry' }),
      makeRule({ id: 'r2', ruleType: 'exit' }),
      makeRule({ id: 'r3', ruleType: 'sizing' }),
    ];
    const checks = [
      makeCheck({ ruleId: 'r1', followed: true }),
      makeCheck({ ruleId: 'r2', followed: true }),
      makeCheck({ ruleId: 'r3', followed: true }),
    ];

    const score = computeAdherenceScore('trade-1', 'pb-1', 'Test Playbook', rules, checks);

    expect(score.score).toBe(100);
    expect(score.totalRules).toBe(3);
    expect(score.rulesFollowed).toBe(3);
    expect(score.ruleChecks.length).toBe(3);
  });

  it('computes 0% when no rules are followed', () => {
    const rules = [
      makeRule({ id: 'r1' }),
      makeRule({ id: 'r2' }),
    ];
    const checks = [
      makeCheck({ ruleId: 'r1', followed: false }),
      makeCheck({ ruleId: 'r2', followed: false }),
    ];

    const score = computeAdherenceScore('trade-1', 'pb-1', 'Test', rules, checks);
    expect(score.score).toBe(0);
    expect(score.rulesFollowed).toBe(0);
  });

  it('computes partial adherence correctly', () => {
    const rules = [
      makeRule({ id: 'r1' }),
      makeRule({ id: 'r2' }),
      makeRule({ id: 'r3' }),
      makeRule({ id: 'r4' }),
    ];
    const checks = [
      makeCheck({ ruleId: 'r1', followed: true }),
      makeCheck({ ruleId: 'r2', followed: false }),
      makeCheck({ ruleId: 'r3', followed: true }),
      makeCheck({ ruleId: 'r4', followed: true }),
    ];

    const score = computeAdherenceScore('trade-1', 'pb-1', 'Test', rules, checks);
    expect(score.score).toBe(75);
    expect(score.rulesFollowed).toBe(3);
    expect(score.totalRules).toBe(4);
  });

  it('treats missing checks as not followed', () => {
    const rules = [
      makeRule({ id: 'r1' }),
      makeRule({ id: 'r2' }),
    ];
    // Only one check exists — r2 is missing → defaults to false
    const checks = [makeCheck({ ruleId: 'r1', followed: true })];

    const score = computeAdherenceScore('trade-1', 'pb-1', 'Test', rules, checks);
    expect(score.score).toBe(50);
    expect(score.rulesFollowed).toBe(1);
  });

  it('returns 0 when there are no rules', () => {
    const score = computeAdherenceScore('trade-1', 'pb-1', 'Test', [], []);
    expect(score.score).toBe(0);
    expect(score.totalRules).toBe(0);
  });

  it('preserves rule type info in ruleChecks', () => {
    const rules = [
      makeRule({ id: 'r1', ruleType: 'entry', ruleText: 'Check RSI' }),
      makeRule({ id: 'r2', ruleType: 'exit', ruleText: 'Set stop loss' }),
    ];
    const checks = [
      makeCheck({ ruleId: 'r1', followed: true }),
    ];

    const score = computeAdherenceScore('trade-1', 'pb-1', 'Test', rules, checks);

    expect(score.ruleChecks[0].ruleType).toBe('entry');
    expect(score.ruleChecks[0].ruleText).toBe('Check RSI');
    expect(score.ruleChecks[0].followed).toBe(true);
    expect(score.ruleChecks[1].ruleType).toBe('exit');
    expect(score.ruleChecks[1].followed).toBe(false);
  });

  it('rounds score to nearest integer', () => {
    const rules = [
      makeRule({ id: 'r1' }),
      makeRule({ id: 'r2' }),
      makeRule({ id: 'r3' }),
    ];
    const checks = [
      makeCheck({ ruleId: 'r1', followed: true }),
    ];

    const score = computeAdherenceScore('trade-1', 'pb-1', 'Test', rules, checks);
    // 1/3 = 33.33... → rounds to 33
    expect(score.score).toBe(33);
  });
});
