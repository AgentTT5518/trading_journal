# Plan: Next Phase Enhancements (Items 1–10) + Future Backlog (11–18)

**Status:** Planning
**Created:** 2026-03-22
**Feature Branches:** One branch per phase

---

## Goal / Problem Statement

The Trading Journal has 8 core features shipped (505 tests). This plan organizes the next 10 enhancements into phased delivery and captures items 11–18 as a future backlog. The goal is to deepen analytics, surface psychology insights, and polish the data model — turning the journal from a logging tool into a decision-improvement system.

---

## Phase A: Quick Wins & Housekeeping
**Branch:** `feature/phase-a-housekeeping`
**Effort:** ~1–2 sessions | **Risk:** Low

### A1 — Wire heatmap click-to-filter
Connect P&L heatmap cells on `/analytics` to `/trades?date=YYYY-MM-DD`. The route and filter UI already exist; this is a link + query param wire-up.

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/features/analytics/components/pnl-heatmap-cell.tsx` | Wrap cell in `<Link href="/trades?date=...">` |
| Modify | `src/features/trades/components/filterable-trade-list.tsx` | Read `date` search param, filter trades to that day |
| Modify | `src/features/trades/components/trade-filters.tsx` | Show active date filter with clear button |

### A2 — Wire `dateFormat` setting into `formatDate()`
The setting is stored in DB but `formatDate()` ignores it. Propagate via a server-component prop or a shared utility that reads settings.

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/shared/utils/formatting.ts` | Accept optional `dateFormat` param in `formatDate()` |
| Modify | Server pages that call `formatDate()` | Pass `dateFormat` from settings query |

### A3 — Update ARCHITECTURE.md
Add missing Feature Log rows for Playbooks & Tags, Reviews, and Screenshots.

| Action | File | Description |
|--------|------|-------------|
| Modify | `ARCHITECTURE.md` | Add 3 Feature Log rows, update Component Map for playbooks/reviews/screenshots |

### A4 — 100% Test Coverage
Execute existing plan at `Plan/Planning/test-coverage/plan.md` (6 phases, ~40 tests). Already fully scoped — just needs implementation.

| Action | File | Description |
|--------|------|-------------|
| Modify | Multiple test files | See test-coverage plan for full file list |
| Modify | `vitest.config.ts` | Add 100% coverage thresholds |

---

## Phase B: Advanced Analytics
**Branch:** `feature/phase-b-analytics`
**Effort:** ~2–3 sessions | **Risk:** Low–Medium
**Depends on:** Phase A (heatmap click-to-filter)

### B1 — Monthly P&L breakdown table
Table showing month-by-month P&L, trade count, win rate, and profit factor. Filterable by year.

| Action | File | Description |
|--------|------|-------------|
| Create | `src/features/analytics/components/monthly-pnl-table.tsx` | Month × metric grid component |
| Modify | `src/features/analytics/services/queries.ts` | Add `getMonthlyBreakdown()` pure function |
| Modify | `src/app/(app)/analytics/page.tsx` | Add monthly table section below heatmap |

### B2 — Drawdown curve
Recharts AreaChart showing running drawdown (peak-to-trough %) over time. Reuses equity curve data.

| Action | File | Description |
|--------|------|-------------|
| Create | `src/features/analytics/components/drawdown-curve.tsx` | Recharts AreaChart (red fill) |
| Modify | `src/features/analytics/services/queries.ts` | Add `computeDrawdownSeries()` pure function |
| Modify | `src/app/(app)/analytics/page.tsx` | Add drawdown section |

### B3 — R-multiple histogram
Distribution chart of R-multiples across closed trades. Already computed in dashboard metrics — needs visualization.

| Action | File | Description |
|--------|------|-------------|
| Create | `src/features/analytics/components/r-multiple-histogram.tsx` | Recharts BarChart with bucket distribution |
| Modify | `src/features/analytics/services/queries.ts` | Add `computeRMultipleBuckets()` |
| Modify | `src/app/(app)/analytics/page.tsx` | Add histogram section |

### B4 — Sharpe & Sortino ratios
Add risk-adjusted return metrics to the analytics page stat cards.

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/features/analytics/services/queries.ts` | Add `computeSharpeRatio()`, `computeSortinoRatio()` |
| Modify | `src/app/(app)/analytics/page.tsx` | Add stat cards for Sharpe/Sortino |

### B5 — Win rate by strategy/playbook
Bar chart comparing win rates across playbooks. Cross-feature query (analytics reads playbooks+trades).

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/features/analytics/services/queries.ts` | Add `getPerformanceByPlaybook()` — joins trades → trade_tags → tags → playbooks |
| Create | `src/features/analytics/components/playbook-performance.tsx` | Grouped bar chart (win rate, avg P&L, profit factor per playbook) |
| Modify | `src/app/(app)/analytics/page.tsx` | Add playbook performance section |

---

## Phase C: Trade List & Filtering
**Branch:** `feature/phase-c-trade-filtering`
**Effort:** ~1–2 sessions | **Risk:** Low

### C1 — Tag-based filtering on trade list
Add tag/category filter chips to the existing `TradeFilters` component.

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/features/trades/components/trade-filters.tsx` | Add tag filter dropdown (multi-select) |
| Modify | `src/features/trades/components/filterable-trade-list.tsx` | Filter logic for selected tags |
| Modify | `src/app/(app)/trades/page.tsx` | Pass tags data to filterable list |

---

## Phase D: Psychology & Context UI
**Branch:** `feature/phase-d-psychology`
**Effort:** ~3–4 sessions | **Risk:** Medium (cross-feature: trades form + schema columns already exist)

The `trades` table already has nullable columns for psychology, swing context, market context, and technical indicators (added in Phase 2 schema). This phase builds the UI to populate them.

### D1 — Pre-trade psychology fields
Add collapsible "Psychology" section to trade form: pre-mood (1–5), confidence (1–5), FOMO flag, revenge flag.

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/features/trades/components/trade-form.tsx` | Add Psychology section (collapsible) |
| Modify | `src/features/trades/components/trade-edit-form.tsx` | Same fields in edit form |
| Modify | `src/features/trades/components/trade-detail.tsx` | Display psychology card |
| Modify | `src/features/trades/validations.ts` | Add psychology fields to Zod schemas |
| Modify | `src/features/trades/services/actions.ts` | Parse + persist psychology fields |

### D2 — Market context fields
Add "Market Context" section: weekly trend (up/down/sideways), VIX level, support/resistance levels, catalyst notes.

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/features/trades/components/trade-form.tsx` | Add Market Context section |
| Modify | `src/features/trades/components/trade-edit-form.tsx` | Same fields in edit form |
| Modify | `src/features/trades/components/trade-detail.tsx` | Display market context card |
| Modify | `src/features/trades/validations.ts` | Add market context fields to Zod schemas |
| Modify | `src/features/trades/services/actions.ts` | Parse + persist market context fields |

### D3 — Technical indicators at entry
Add "Technicals" section: RSI, MACD signal, distance from 20/50/200 MA, ATR, volume profile notes.

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/features/trades/components/trade-form.tsx` | Add Technicals section |
| Modify | `src/features/trades/components/trade-edit-form.tsx` | Same fields in edit form |
| Modify | `src/features/trades/components/trade-detail.tsx` | Display technicals card |
| Modify | `src/features/trades/validations.ts` | Add technical fields to Zod schemas |
| Modify | `src/features/trades/services/actions.ts` | Parse + persist technical fields |

---

## Phase Summary

| Phase | Items | Effort | Dependencies |
|-------|-------|--------|--------------|
| **A** — Quick Wins | A1 (heatmap link), A2 (dateFormat), A3 (docs), A4 (test coverage) | ~1–2 sessions | None |
| **B** — Advanced Analytics | B1 (monthly table), B2 (drawdown), B3 (R-histogram), B4 (Sharpe/Sortino), B5 (playbook perf) | ~2–3 sessions | A1 |
| **C** — Trade Filtering | C1 (tag filter) | ~1–2 sessions | None |
| **D** — Psychology & Context | D1 (psychology), D2 (market context), D3 (technicals) | ~3–4 sessions | None |

**Recommended execution order:** A → C → B → D
- A first because it's low-risk housekeeping that unblocks B
- C next because tag filtering is standalone and improves daily workflow
- B before D because analytics provide immediate value with existing data
- D last because it requires the most form work and is input-heavy

---

## Future Backlog (Items 11–18)

These are deferred to a later planning cycle. Captured here for reference.

| # | Enhancement | Description | Complexity |
|---|-------------|-------------|------------|
| 11 | **Trade replay / backtesting** | Step through historical trades to practice decisions; simulated entry/exit with hidden outcome reveal | High |
| 12 | **PDF/Excel reports** | Generate weekly/monthly performance reports as downloadable PDF or Excel files | Medium |
| 13 | **Mobile responsive polish** | Touch events for heatmap tooltips, responsive table layouts, mobile sidebar drawer | Medium |
| ~~14~~ | ~~**Review auto-population**~~ | ~~Wire review detail pages to auto-pull trade summaries, win rates, best/worst trades for the review period~~ | ~~Medium~~ **DONE** (PR #23, 2026-03-24) |
| 15 | **Broker CSV import** | Parse CSV exports from TD Ameritrade, IBKR, Schwab into the trade schema with field mapping UI | High |
| ~~16~~ | ~~**Correlation analysis**~~ | ~~Surface patterns between psychology (mood, energy, FOMO) and P&L outcomes; scatter plots + regression~~ | ~~High~~ **DONE** (PR #24, 2026-03-24) |
| ~~17~~ | ~~**Rule adherence scoring**~~ | ~~Track which playbook rules were followed/broken per trade; correlate with outcomes~~ | ~~Medium~~ **DONE** (PR #24, 2026-03-24) |
| 18 | **Goal tracking dashboard** | Set monthly P&L targets, max loss limits, trade frequency goals; progress bars + alerts | Medium |

### Future dependency notes
- ~~**Item 16** (correlation analysis) requires **Phase D** (psychology UI) to have data to correlate~~ **SHIPPED**
- ~~**Item 14** (review auto-population) is a natural follow-up to Phase B analytics queries~~ **SHIPPED**
- ~~**Item 17** (rule adherence) builds on Playbooks feature — needs B5 first for playbook perf baseline~~ **SHIPPED**
- **Items 11, 15** are standalone but high-effort; good candidates for dedicated feature branches
- **Remaining backlog:** Items 11, 12, 13, 15, 18 (5 items)

---

## Open Questions

- [ ] Phase D: Should psychology/market/technicals be 3 separate collapsible sections or tabs within the trade form?
- [ ] Phase B5: Should playbook performance be on the analytics page or a dedicated `/playbooks/analytics` sub-route?
- [ ] Phase C1: Should tag filtering be URL-param based (shareable) or client-state only?

## Decisions Made

- Items 1–10 grouped into 4 phases (A–D) by theme and dependency
- Execution order A → C → B → D based on effort/value ratio
- Items 11–18 deferred as future backlog — not forgotten, just not scoped yet
- Each phase gets its own feature branch per CLAUDE.md git workflow
- Phase A4 reuses the existing test-coverage plan (no duplication)

## Comments / Review Notes

-
