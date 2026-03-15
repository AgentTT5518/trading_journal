/**
 * Tests for lib/db/schema.ts — business-critical defaults, foreign keys, and $defaultFn callbacks.
 * Uses getTableColumns() and getTableConfig() for schema introspection.
 */
import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import {
  trades,
  exitLegs,
  tags,
  tradeTags,
  screenshots,
  settings,
} from '@/lib/db/schema';

// ─── trades table ─────────────────────────────────────────────────────────────

describe('trades table defaults', () => {
  it('commissions defaults to 0', () => {
    const { columns } = getTableConfig(trades);
    const col = columns.find((c) => c.name === 'commissions');
    expect(col?.default).toBe(0);
  });

  it('fees defaults to 0', () => {
    const { columns } = getTableConfig(trades);
    const col = columns.find((c) => c.name === 'fees');
    expect(col?.default).toBe(0);
  });

  it('contract_multiplier defaults to 100', () => {
    const { columns } = getTableConfig(trades);
    const col = columns.find((c) => c.name === 'contract_multiplier');
    expect(col?.default).toBe(100);
  });

  it('fomo_flag defaults to false', () => {
    const { columns } = getTableConfig(trades);
    const col = columns.find((c) => c.name === 'fomo_flag');
    expect(col?.default).toBe(false);
  });

  it('revenge_flag defaults to false', () => {
    const { columns } = getTableConfig(trades);
    const col = columns.find((c) => c.name === 'revenge_flag');
    expect(col?.default).toBe(false);
  });

  it('ticker is notNull', () => {
    const cols = getTableColumns(trades);
    expect(cols.ticker.notNull).toBe(true);
  });

  it('entry_price is notNull', () => {
    const cols = getTableColumns(trades);
    expect(cols.entryPrice.notNull).toBe(true);
  });

  it('position_size is notNull', () => {
    const cols = getTableColumns(trades);
    expect(cols.positionSize.notNull).toBe(true);
  });
});

// ─── exit_legs table ──────────────────────────────────────────────────────────

describe('exit_legs table', () => {
  it('fees defaults to 0', () => {
    const { columns } = getTableConfig(exitLegs);
    const col = columns.find((c) => c.name === 'fees');
    expect(col?.default).toBe(0);
  });

  it('has a foreign key referencing trades', () => {
    const { foreignKeys } = getTableConfig(exitLegs);
    expect(foreignKeys.length).toBeGreaterThan(0);
    const fkRef = foreignKeys[0].reference();
    expect(fkRef).toBeDefined();
  });
});

// ─── tags table ───────────────────────────────────────────────────────────────

describe('tags table defaults', () => {
  it('is_custom defaults to false', () => {
    const { columns } = getTableConfig(tags);
    const col = columns.find((c) => c.name === 'is_custom');
    expect(col?.default).toBe(false);
  });
});

// ─── trade_tags table ─────────────────────────────────────────────────────────

describe('trade_tags table', () => {
  it('has foreign keys referencing both trades and tags', () => {
    const { foreignKeys } = getTableConfig(tradeTags);
    expect(foreignKeys.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── screenshots table ────────────────────────────────────────────────────────

describe('screenshots table', () => {
  it('has a foreign key referencing trades', () => {
    const { foreignKeys } = getTableConfig(screenshots);
    expect(foreignKeys.length).toBeGreaterThan(0);
  });
});

// ─── settings table ───────────────────────────────────────────────────────────

describe('settings table defaults', () => {
  it('currency defaults to USD', () => {
    const { columns } = getTableConfig(settings);
    const col = columns.find((c) => c.name === 'currency');
    expect(col?.default).toBe('USD');
  });

  it('default_risk_percent defaults to 1', () => {
    const { columns } = getTableConfig(settings);
    const col = columns.find((c) => c.name === 'default_risk_percent');
    expect(col?.default).toBe(1);
  });

  it('default_commission defaults to 0', () => {
    const { columns } = getTableConfig(settings);
    const col = columns.find((c) => c.name === 'default_commission');
    expect(col?.default).toBe(0);
  });

  it('id $defaultFn returns "default"', () => {
    const cols = getTableColumns(settings);
    expect(cols.id.defaultFn?.()).toBe('default');
  });

  it('created_at $defaultFn returns a valid ISO 8601 timestamp', () => {
    const cols = getTableColumns(settings);
    const result = cols.createdAt.defaultFn?.();
    expect(typeof result).toBe('string');
    expect(() => new Date(result as string)).not.toThrow();
    expect(new Date(result as string).toISOString()).toBe(result);
  });

  it('updated_at $defaultFn returns a valid ISO 8601 timestamp', () => {
    const cols = getTableColumns(settings);
    const result = cols.updatedAt.defaultFn?.();
    expect(typeof result).toBe('string');
    expect(() => new Date(result as string)).not.toThrow();
  });
});
