# Feature Requirements: Reviews

**Phase:** Reviews (Phase 8)
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-24

---

## Overview

The reviews feature provides structured daily, weekly, and monthly trading reviews at `/reviews`. Each review covers a date range and auto-populates trade summaries, best/worst trades, and ticker breakdowns from closed trades in that period. Computed metrics include win rate, total P&L, profit factor, and average P&L. Traders assign a grade (A-F), write lessons learned, and set goals for the next period. Reviews link to trades via a junction table.

---

## User Stories

### US-1 — Create a review
**As a trader, I want to create structured reviews for specific periods so I can systematically evaluate my performance.**

- Review types: daily, weekly, monthly
- Date range selection (start date + end date)
- Auto-populated fields based on closed trades in the period

**Acceptance criteria:**
- [x] Form with type selector (daily/weekly/monthly)
- [x] Date range picker for start and end dates
- [x] Trade summaries auto-populated from closed trades in range
- [x] Best and worst trades identified by net P&L
- [x] Ticker breakdown computed (trade count, win count, win rate, total P&L, avg P&L)
- [x] Computed metrics: trade count, win rate, total P&L, avg P&L, best P&L, worst P&L, profit factor
- [x] Grade assignment (A, B, C, D, F)
- [x] Free-form fields: notes, lessons learned, goals for next period
- [x] Rules followed and rules broken (JSON arrays stored as text)
- [x] Review-trade junction rows created automatically

### US-2 — View review list
**As a trader, I want to browse my reviews in reverse chronological order so I can track my progress over time.**

**Acceptance criteria:**
- [x] List sorted by start date descending
- [x] Each row shows type badge, date range, grade, and trade count
- [x] Empty state when no reviews exist

### US-3 — View review detail
**As a trader, I want to view a complete review with all metrics, trade summaries, and reflections.**

**Acceptance criteria:**
- [x] Metrics summary section with all computed values
- [x] Best and worst trades highlighted
- [x] Ticker breakdown table
- [x] Trade summary list with direction, ticker, and P&L
- [x] Notes, lessons learned, and goals displayed
- [x] Grade prominently shown

### US-4 — Edit a review
**As a trader, I want to edit a review to update my reflections or grade.**

**Acceptance criteria:**
- [x] Edit form pre-populated with existing data
- [x] Metrics recomputed on date range change
- [x] Junction rows synced on save
- [x] Redirects to detail page after save

### US-5 — Delete a review
**As a trader, I want to delete a review I no longer need.**

**Acceptance criteria:**
- [x] Confirmation required before deletion
- [x] Junction rows cascade-deleted
- [x] Redirects to review list after deletion

### US-6 — Loading and error states
**As a trader, I want skeleton loaders and error boundaries for review pages.**

**Acceptance criteria:**
- [x] `/reviews/loading.tsx` renders skeleton
- [x] `/reviews/error.tsx` renders error boundary with retry

---

## Data Model

### `reviews` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `type` | text | NOT NULL, enum: daily, weekly, monthly |
| `start_date` | text | NOT NULL, ISO 8601 |
| `end_date` | text | NOT NULL, ISO 8601 |
| `grade` | text | nullable, enum: A, B, C, D, F |
| `notes` | text | nullable |
| `lessons_learned` | text | nullable |
| `goals_for_next` | text | nullable |
| `rules_followed` | text | nullable, JSON array as text |
| `rules_broken` | text | nullable, JSON array as text |
| `created_at` | text | NOT NULL, ISO 8601 |
| `updated_at` | text | NOT NULL, ISO 8601 |

### `review_trades` junction table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `review_id` | text | NOT NULL, FK -> reviews.id (cascade) |
| `trade_id` | text | NOT NULL, FK -> trades.id (cascade) |

### Computed types (never stored)

| Type | Description |
|------|-------------|
| `ReviewMetrics` | trade count, win/loss counts, win rate, total P&L, avg P&L, best/worst P&L, best/worst trade highlights, profit factor, ticker breakdown |
| `TradeSummary` | id, ticker, direction, entry date, exit date, net P&L |
| `TradeHighlight` | id, ticker, direction, net P&L (for best/worst) |
| `TickerBreakdown` | ticker, trade count, win count, win rate, total P&L, avg P&L |

---

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/reviews` | Server | Review list page |
| `/reviews/new` | Server | Create review form with auto-population |
| `/reviews/[id]` | Server | Review detail with metrics and summaries |
| `/reviews/[id]/edit` | Server | Edit review form |
| `/reviews/loading.tsx` | Server | Skeleton loading state |
| `/reviews/error.tsx` | Client | Error boundary with retry |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `ReviewList` | Client | `src/features/reviews/components/review-list.tsx` | Paginated list with type badges and grades |
| `ReviewForm` | Client | `src/features/reviews/components/review-form.tsx` | Create form with auto-population |
| `ReviewEditForm` | Client | `src/features/reviews/components/review-edit-form.tsx` | Edit form pre-filled with existing data |
| `ReviewDetail` | Client | `src/features/reviews/components/review-detail.tsx` | Full review view with all sections |
| `ReviewMetricsSummary` | Client | `src/features/reviews/components/review-metrics-summary.tsx` | Stat cards for computed metrics |
| `ReviewBestWorstTrades` | Client | `src/features/reviews/components/review-best-worst-trades.tsx` | Highlighted best and worst trades |
| `ReviewTickerBreakdown` | Client | `src/features/reviews/components/review-ticker-breakdown.tsx` | Table of per-ticker stats |
| `ReviewTradeSummary` | Client | `src/features/reviews/components/review-trade-summary.tsx` | List of trades in the review period |
| `RulesListInput` | Client | `src/features/reviews/components/rules-list-input.tsx` | Editable rules followed/broken lists |

## Services

| Function | Location | Description |
|----------|----------|-------------|
| `getReviews` | `src/features/reviews/services/queries.ts` | Fetch all reviews with trade counts |
| `getReviewById` | `src/features/reviews/services/queries.ts` | Fetch single review with trade IDs and summaries |
| `createReview` | `src/features/reviews/services/actions.ts` | Server action — insert review + junction rows |
| `updateReview` | `src/features/reviews/services/actions.ts` | Server action — update review + sync junction rows |
| `deleteReview` | `src/features/reviews/services/actions.ts` | Server action — delete review (junction cascades) |
| `computeReviewMetrics` | `src/features/reviews/services/metrics.ts` | Pure function — compute all metrics from trade data |

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/reviews/validations.test.ts` | — | Schema validation for review fields |
| `tests/features/reviews/metrics.test.ts` | — | Metric computation: win rate, P&L, ticker breakdown, profit factor, best/worst |
| `tests/features/reviews/review-actions.test.ts` | — | Create, update, delete actions with junction sync |
