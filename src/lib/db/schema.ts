import { sqliteTable, text, integer, real, unique } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============================================================
// CORE TABLES (Phase 1)
// ============================================================

export const trades = sqliteTable('trades', {
  id: text('id').primaryKey(),

  // Asset class
  assetClass: text('asset_class', { enum: ['stock', 'option', 'crypto'] }).notNull(),
  ticker: text('ticker').notNull(),
  direction: text('direction', { enum: ['long', 'short'] }).notNull(),

  // Entry
  entryDate: text('entry_date').notNull(),
  entryPrice: real('entry_price').notNull(),
  positionSize: real('position_size').notNull(),
  orderType: text('order_type', { enum: ['market', 'limit', 'stop_limit'] }),
  entryTrigger: text('entry_trigger'),

  // Exit (single exit; partial exits use exit_legs in Phase 2)
  exitDate: text('exit_date'),
  exitPrice: real('exit_price'),
  exitReason: text('exit_reason', {
    enum: ['target_hit', 'stop_hit', 'trailing_stop', 'time_based', 'discretionary', 'other'],
  }),

  // Risk parameters (Phase 2)
  plannedStopLoss: real('planned_stop_loss'),
  actualStopLoss: real('actual_stop_loss'),
  plannedTarget1: real('planned_target_1'),
  plannedTarget2: real('planned_target_2'),
  plannedTarget3: real('planned_target_3'),
  riskRewardPlanned: real('risk_reward_planned'),
  invalidationLevel: real('invalidation_level'),

  // Financials
  commissions: real('commissions').default(0),
  fees: real('fees').default(0),

  // Notes
  notes: text('notes'),

  // Psychology (Phase 4)
  preMood: integer('pre_mood'),
  preConfidence: integer('pre_confidence'),
  fomoFlag: integer('fomo_flag', { mode: 'boolean' }).default(false),
  revengeFlag: integer('revenge_flag', { mode: 'boolean' }).default(false),
  anxietyDuring: integer('anxiety_during'),
  urgeToExitEarly: integer('urge_to_exit_early', { mode: 'boolean' }),
  urgeToAdd: integer('urge_to_add', { mode: 'boolean' }),
  executionSatisfaction: integer('execution_satisfaction'),
  lessonsLearned: text('lessons_learned'),
  tradeGrade: text('trade_grade', { enum: ['A', 'B', 'C', 'D', 'F'] }),

  // Swing-specific (Phase 5)
  plannedHoldDays: integer('planned_hold_days'),
  heldOverWeekend: integer('held_over_weekend', { mode: 'boolean' }),
  heldThroughEarnings: integer('held_through_earnings', { mode: 'boolean' }),
  heldThroughMacro: integer('held_through_macro', { mode: 'boolean' }),

  // Market context (Phase 5)
  weeklyTrend: text('weekly_trend', { enum: ['up', 'down', 'sideways'] }),
  marketRegime: text('market_regime', { enum: ['trending', 'choppy', 'high_vol', 'low_vol'] }),
  vixLevel: real('vix_level'),
  supportLevel: real('support_level'),
  resistanceLevel: real('resistance_level'),
  sectorPerformance: text('sector_performance'),
  upcomingCatalysts: text('upcoming_catalysts'),

  // Technical context (Phase 5)
  rsiAtEntry: real('rsi_at_entry'),
  macdAtEntry: text('macd_at_entry'),
  distanceFrom50ma: real('distance_from_50ma'),
  distanceFrom200ma: real('distance_from_200ma'),
  volumeProfile: text('volume_profile', { enum: ['above_avg', 'below_avg', 'avg'] }),
  atrAtEntry: real('atr_at_entry'),

  // Crypto-specific (Phase 2)
  exchange: text('exchange'),
  tradingPair: text('trading_pair'),
  makerFee: real('maker_fee'),
  takerFee: real('taker_fee'),
  networkFee: real('network_fee'),
  fundingRate: real('funding_rate'),
  leverage: real('leverage'),
  liquidationPrice: real('liquidation_price'),
  marketCapCategory: text('market_cap_category', { enum: ['large', 'mid', 'small', 'micro'] }),
  tokenType: text('token_type'),
  btcDominance: real('btc_dominance'),
  btcCorrelation: real('btc_correlation'),

  // Options-specific (Phase 2)
  optionType: text('option_type', { enum: ['call', 'put'] }),
  strike: real('strike'),
  expiry: text('expiry'),
  contracts: real('contracts'),
  contractMultiplier: real('contract_multiplier').default(100),
  delta: real('delta'),
  gamma: real('gamma'),
  theta: real('theta'),
  vega: real('vega'),
  iv: real('iv'),
  ivRank: real('iv_rank'),

  // Spread linking (Phase 2)
  spreadId: text('spread_id'),
  spreadType: text('spread_type', {
    enum: ['vertical', 'iron_condor', 'straddle', 'strangle', 'butterfly', 'calendar', 'diagonal', 'custom'],
  }),

  // Metadata
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Partial exits / scale-out (defined Phase 1, wired up Phase 2)
export const exitLegs = sqliteTable('exit_legs', {
  id: text('id').primaryKey(),
  tradeId: text('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  exitDate: text('exit_date').notNull(),
  exitPrice: real('exit_price').notNull(),
  quantity: real('quantity').notNull(),
  exitReason: text('exit_reason'),
  fees: real('fees').default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// ============================================================
// PLAYBOOKS (Phase 7b)
// ============================================================

export const playbooks = sqliteTable('playbooks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  entryRules: text('entry_rules'),
  exitRules: text('exit_rules'),
  marketConditions: text('market_conditions'),
  positionSizingRules: text('position_sizing_rules'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ============================================================
// TAGS (Phase 7a)
// ============================================================

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', {
    enum: [
      'strategy',
      'market_condition',
      'timeframe',
      'instrument',
      'execution',
      'mistake',
    ],
  }).notNull(),
  playbookId: text('playbook_id').references(() => playbooks.id, { onDelete: 'set null' }),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull(),
});

export const tradeTags = sqliteTable('trade_tags', {
  id: text('id').primaryKey(),
  tradeId: text('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// ============================================================
// PLAYBOOK RULES (Rule Adherence)
// ============================================================

export const playbookRules = sqliteTable('playbook_rules', {
  id: text('id').primaryKey(),
  playbookId: text('playbook_id').notNull().references(() => playbooks.id, { onDelete: 'cascade' }),
  ruleText: text('rule_text').notNull(),
  ruleType: text('rule_type', { enum: ['entry', 'exit', 'sizing'] }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const tradeRuleChecks = sqliteTable('trade_rule_checks', {
  id: text('id').primaryKey(),
  tradeId: text('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  ruleId: text('rule_id').notNull().references(() => playbookRules.id, { onDelete: 'cascade' }),
  followed: integer('followed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// ============================================================
// SCREENSHOTS (Phase 6)
// ============================================================

export const screenshots = sqliteTable('screenshots', {
  id: text('id').primaryKey(),
  tradeId: text('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// ============================================================
// REVIEWS (Phase 8)
// ============================================================

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  grade: text('grade', { enum: ['A', 'B', 'C', 'D', 'F'] }),
  notes: text('notes'),
  lessonsLearned: text('lessons_learned'),
  goalsForNext: text('goals_for_next'),
  rulesFollowed: text('rules_followed'), // JSON array stored as text
  rulesBroken: text('rules_broken'), // JSON array stored as text
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const reviewTrades = sqliteTable('review_trades', {
  id: text('id').primaryKey(),
  reviewId: text('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  tradeId: text('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
});

// ============================================================
// JOURNAL (Journal Feature)
// ============================================================

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  category: text('category', {
    enum: ['pre_market', 'post_market', 'intraday', 'general', 'lesson'],
  }).notNull(),
  title: text('title'),
  content: text('content').notNull(),
  mood: integer('mood'), // 1-5
  energy: integer('energy'), // 1-5
  marketSentiment: text('market_sentiment', {
    enum: ['bullish', 'bearish', 'neutral', 'uncertain'],
  }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const journalTrades = sqliteTable(
  'journal_trades',
  {
    id: text('id').primaryKey(),
    journalEntryId: text('journal_entry_id')
      .notNull()
      .references(() => journalEntries.id, { onDelete: 'cascade' }),
    tradeId: text('trade_id')
      .notNull()
      .references(() => trades.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqJournalTrade: unique().on(table.journalEntryId, table.tradeId),
  })
);

// ============================================================
// SETTINGS (Settings Feature)
// ============================================================

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => 'default'),
  traderName: text('trader_name').notNull().default(''),
  timezone: text('timezone').notNull().default('America/New_York'),
  currency: text('currency').notNull().default('USD'),
  startingCapital: real('starting_capital'), // null = unset; avoids misleading P&L with default 0
  defaultCommission: real('default_commission').notNull().default(0),
  defaultRiskPercent: real('default_risk_percent').notNull().default(1),
  positionSizingMethod: text('position_sizing_method').notNull().default('fixed-dollar'),
  dateFormat: text('date_format').notNull().default('MM/DD/YYYY'),
  theme: text('theme').notNull().default('system'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ============================================================
// RELATIONS
// ============================================================

export const tradesRelations = relations(trades, ({ many }) => ({
  exitLegs: many(exitLegs),
  tradeTags: many(tradeTags),
  screenshots: many(screenshots),
  reviewTrades: many(reviewTrades),
  journalTrades: many(journalTrades),
  ruleChecks: many(tradeRuleChecks),
}));

export const exitLegsRelations = relations(exitLegs, ({ one }) => ({
  trade: one(trades, { fields: [exitLegs.tradeId], references: [trades.id] }),
}));

export const playbooksRelations = relations(playbooks, ({ many }) => ({
  tags: many(tags),
  rules: many(playbookRules),
}));

export const playbookRulesRelations = relations(playbookRules, ({ one }) => ({
  playbook: one(playbooks, { fields: [playbookRules.playbookId], references: [playbooks.id] }),
}));

export const tradeRuleChecksRelations = relations(tradeRuleChecks, ({ one }) => ({
  trade: one(trades, { fields: [tradeRuleChecks.tradeId], references: [trades.id] }),
  rule: one(playbookRules, { fields: [tradeRuleChecks.ruleId], references: [playbookRules.id] }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  playbook: one(playbooks, { fields: [tags.playbookId], references: [playbooks.id] }),
  tradeTags: many(tradeTags),
}));

export const tradeTagsRelations = relations(tradeTags, ({ one }) => ({
  trade: one(trades, { fields: [tradeTags.tradeId], references: [trades.id] }),
  tag: one(tags, { fields: [tradeTags.tagId], references: [tags.id] }),
}));

export const screenshotsRelations = relations(screenshots, ({ one }) => ({
  trade: one(trades, { fields: [screenshots.tradeId], references: [trades.id] }),
}));

export const reviewsRelations = relations(reviews, ({ many }) => ({
  reviewTrades: many(reviewTrades),
}));

export const reviewTradesRelations = relations(reviewTrades, ({ one }) => ({
  review: one(reviews, { fields: [reviewTrades.reviewId], references: [reviews.id] }),
  trade: one(trades, { fields: [reviewTrades.tradeId], references: [trades.id] }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  journalTrades: many(journalTrades),
}));

export const journalTradesRelations = relations(journalTrades, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalTrades.journalEntryId],
    references: [journalEntries.id],
  }),
  trade: one(trades, { fields: [journalTrades.tradeId], references: [trades.id] }),
}));
