import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
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
// RELATIONS
// ============================================================

export const tradesRelations = relations(trades, ({ many }) => ({
  exitLegs: many(exitLegs),
}));

export const exitLegsRelations = relations(exitLegs, ({ one }) => ({
  trade: one(trades, { fields: [exitLegs.tradeId], references: [trades.id] }),
}));
