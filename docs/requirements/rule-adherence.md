# Feature Requirements: Rule Adherence

**Phase:** Rule Adherence
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-24

---

## Overview

The rule adherence feature adds structured rules to playbooks and per-trade rule checklists. Rules are categorized into 3 types (entry, exit, sizing) and managed within playbook detail pages. When logging a trade, traders check which rules they followed. An adherence score (percentage of rules followed) is computed per trade. Analytics show the correlation between rule-following and P&L outcomes.

---

## User Stories

### US-1 — Manage playbook rules
**As a trader, I want to define specific rules within my playbooks so I have a clear checklist for each strategy.**

- Rules categorized as entry, exit, or sizing
- CRUD operations within playbook detail page
- Rules have a sort order for display

**Acceptance criteria:**
- [x] Rule manager component on playbook detail page
- [x] Create rule with text and type (entry/exit/sizing)
- [x] Edit rule text
- [x] Delete rule (cascade deletes trade rule checks)
- [x] Rules displayed grouped by type with sort order
- [x] Rules persist per playbook

### US-2 — Check rules per trade
**As a trader, I want a checklist of rules on the trade form so I can mark which rules I followed for each trade.**

- Rules tab on trade create and edit forms
- Checkboxes for each rule in the linked playbook
- Check state saved as trade_rule_checks records

**Acceptance criteria:**
- [x] Trade rules tab shown on new trade and edit trade forms
- [x] Rules displayed grouped by type (entry, exit, sizing)
- [x] Checkbox for each rule (followed: true/false)
- [x] Rule checks synced on trade save
- [x] Only shows rules from the playbook associated with the trade's tags

### US-3 — View adherence score per trade
**As a trader, I want to see an adherence score for each trade so I can quickly assess how disciplined I was.**

- Score = (rules followed / total rules) * 100
- Displayed as a percentage badge

**Acceptance criteria:**
- [x] Adherence score computed as percentage (0-100)
- [x] Score badge component with color coding (green > 80, yellow > 50, red <= 50)
- [x] Score shown on trade detail page
- [x] Never stored — always computed from rule check records

### US-4 — View adherence analytics
**As a trader, I want to see how rule adherence correlates with my P&L so I can prove that following rules improves results.**

- Scatter plot: adherence score (x) vs net P&L (y)
- Breakdown by rule type showing follow rate
- Average adherence score across all scored trades

**Acceptance criteria:**
- [x] Adherence overview section on playbook detail page
- [x] Scatter plot with adherence score vs net P&L
- [x] Average adherence score displayed
- [x] Total trades scored count
- [x] Breakdown by rule type (entry, exit, sizing) with follow rate percentage
- [x] Built with Recharts

---

## Data Model

### `playbook_rules` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `playbook_id` | text | NOT NULL, FK -> playbooks.id (cascade) |
| `rule_text` | text | NOT NULL |
| `rule_type` | text | NOT NULL, enum: entry, exit, sizing |
| `sort_order` | integer | NOT NULL, default 0 |
| `created_at` | text | NOT NULL, ISO 8601 |

### `trade_rule_checks` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `trade_id` | text | NOT NULL, FK -> trades.id (cascade) |
| `rule_id` | text | NOT NULL, FK -> playbook_rules.id (cascade) |
| `followed` | integer | NOT NULL, boolean, default false |
| `created_at` | text | NOT NULL, ISO 8601 |

### Computed types (never stored)

| Type | Description |
|------|-------------|
| `RuleAdherenceScore` | tradeId, playbookId, playbookName, totalRules, rulesFollowed, score (0-100), ruleChecks array |
| `AdherenceCorrelationPoint` | tradeId, ticker, score, netPnl — one point on scatter plot |
| `AdherenceByRuleType` | ruleType, totalChecks, followedCount, rate (0-100) |
| `AdherenceOverviewData` | averageScore, totalTradesScored, correlationPoints[], byRuleType[] |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `RuleManager` | Client | `src/features/rule-adherence/components/rule-manager.tsx` | CRUD for playbook rules on playbook detail page |
| `TradeRuleChecklist` | Client | `src/features/rule-adherence/components/trade-rule-checklist.tsx` | Checkbox list of rules for a trade |
| `TradeRulesTab` | Client | `src/features/rule-adherence/components/trade-rules-tab.tsx` | Tab wrapper for rule checklist in trade forms |
| `AdherenceScoreBadge` | Server-safe | `src/features/rule-adherence/components/adherence-score-badge.tsx` | Color-coded percentage badge |
| `AdherenceOverview` | Client | `src/features/rule-adherence/components/adherence-overview.tsx` | Analytics section with scatter plot and stats |

## Services

| Function | Location | Description |
|----------|----------|-------------|
| `getRulesByPlaybookId` | `src/features/rule-adherence/services/queries.ts` | Fetch all rules for a playbook grouped by type |
| `getTradeRuleChecks` | `src/features/rule-adherence/services/queries.ts` | Fetch rule check state for a trade |
| `getAdherenceScore` | `src/features/rule-adherence/services/queries.ts` | Compute adherence score for a trade |
| `getAdherenceOverview` | `src/features/rule-adherence/services/queries.ts` | Compute full analytics data for a playbook |
| `createRule` | `src/features/rule-adherence/services/actions.ts` | Server action — add rule to playbook |
| `updateRule` | `src/features/rule-adherence/services/actions.ts` | Server action — edit rule text |
| `deleteRule` | `src/features/rule-adherence/services/actions.ts` | Server action — remove rule (checks cascade) |
| `syncTradeRuleChecks` | `src/features/rule-adherence/services/actions.ts` | Server action — upsert rule check states for a trade |

---

## Integration Points

- **Playbook detail page** (`/playbooks/[id]`): RuleManager for CRUD, AdherenceOverview for analytics
- **Trade create form** (`/trades/new`): TradeRulesTab with checklist
- **Trade edit form** (`/trades/[id]/edit`): TradeRulesTab with pre-filled check state
- **Trade form/edit form** (`src/features/trades/components/`): Rule checklist section embedded

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/rule-adherence/queries.test.ts` | — | Rule queries, adherence score computation, overview analytics, edge cases (no rules, no checks) |
