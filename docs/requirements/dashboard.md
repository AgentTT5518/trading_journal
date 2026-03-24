# Feature Requirements: Dashboard

**Phase:** Dashboard
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-24

---

## Overview

The dashboard at `/dashboard` provides a performance overview for the trader. It displays summary stat cards (total P&L, win rate, profit factor, max drawdown, avg win/loss, R-multiple stats), an equity curve, asset class breakdown, win/loss distribution, R-multiple distribution, a recent trades table, and a mood heatmap. A date range filter (7D/30D/90D/YTD/All) controls the time window via URL search params.

---

## User Stories

### US-1 — View summary stat cards
**As a trader, I want to see key performance metrics at a glance so I can assess my overall trading health.**

- Cards: Total P&L, Win Rate, Profit Factor, Max Drawdown, Avg Win, Avg Loss, Avg R-Multiple
- Each card shows a value and subtitle label

**Acceptance criteria:**
- [x] Total P&L formatted as currency with green/red coloring
- [x] Win rate shown as percentage
- [x] Profit factor computed as gross profit / gross loss
- [x] Max drawdown shown as currency
- [x] Avg win and avg loss shown as currency
- [x] Avg R-multiple shown with 2 decimal places (or "N/A" if no R data)
- [x] All metrics respond to date range filter

### US-2 — Filter by date range
**As a trader, I want to filter all dashboard data by preset date ranges so I can analyze specific periods.**

- Preset options: 7D, 30D, 90D, YTD, All
- Selection persisted in URL search params (`?range=7d`)

**Acceptance criteria:**
- [x] Filter buttons rendered in a toggle group
- [x] Selected range reflected in URL params
- [x] All cards, charts, and tables update when range changes
- [x] Default is "All" when no param present

### US-3 — View equity curve
**As a trader, I want to see my cumulative P&L over time as a line chart so I can visualize my equity growth.**

- Recharts AreaChart with date on x-axis, cumulative P&L on y-axis
- Each point includes ticker label

**Acceptance criteria:**
- [x] Cumulative P&L computed chronologically from closed trades
- [x] Green fill for positive area, red for negative
- [x] Tooltip shows date, ticker, and cumulative P&L
- [x] Responds to date range filter

### US-4 — View asset class breakdown
**As a trader, I want to see P&L broken down by asset class so I can identify which markets perform best.**

- Recharts BarChart with stock, option, crypto bars

**Acceptance criteria:**
- [x] Bar for each asset class showing total P&L
- [x] Trade count shown in tooltip
- [x] Green for profit, red for loss bars

### US-5 — View win/loss distribution
**As a trader, I want a pie chart showing win vs loss ratio so I can quickly see my success rate visually.**

**Acceptance criteria:**
- [x] PieChart with wins (green) and losses (red) segments
- [x] Count labels on each segment
- [x] Handles zero-trade state gracefully

### US-6 — View R-multiple distribution
**As a trader, I want to see how my R-multiples are distributed so I can evaluate risk-reward consistency.**

- Histogram of R-multiple buckets with expectancy stat

**Acceptance criteria:**
- [x] Buckets: < -2R, -2R to -1R, -1R to 0R, 0R to 1R, 1R to 2R, > 2R
- [x] Expectancy, avg win R, avg loss R displayed
- [x] Only includes trades with planned stop loss

### US-7 — View recent trades table
**As a trader, I want to see my last 10 closed trades so I can quickly review recent activity.**

**Acceptance criteria:**
- [x] Table shows ticker, asset class, direction, exit date, net P&L, P&L %
- [x] Limited to 10 most recent closed trades
- [x] P&L colored green/red
- [x] Row links to trade detail page

### US-8 — View mood heatmap
**As a trader, I want a 2-month calendar colored by my journal mood entries so I can spot emotional patterns.**

- Calendar shows current and previous month
- Days colored by average mood score (1-5) from journal entries

**Acceptance criteria:**
- [x] 2-month grid (current + previous) with 7-column layout
- [x] 5 color tiers mapped to mood 1-5 (red to green)
- [x] Multiple entries per day deduplicated by averaging mood
- [x] Days with no journal entries shown as neutral
- [x] Tooltip shows date and average mood

### US-9 — Loading state
**As a trader, I want a skeleton loader while dashboard data fetches.**

**Acceptance criteria:**
- [x] `/dashboard/loading.tsx` renders skeleton cards and chart placeholders

---

## Data Model

No schema changes — all data computed from existing `trades`, `exit_legs`, and `journal_entries` tables.

| Computed type | Description |
|---------------|-------------|
| `DashboardSummary` | Total P&L, win rate, total trades, avg R-multiple, profit factor, max drawdown, avg win, avg loss |
| `EquityCurvePoint` | `{ date, cumulativePnl, ticker }` — one point on the equity curve |
| `AssetClassPnl` | `{ assetClass, totalPnl, tradeCount }` — per-asset-class breakdown |
| `WinLossData` | `{ wins, losses }` — counts for pie chart |
| `RecentTradeRow` | `{ id, ticker, assetClass, direction, exitDate, netPnl, pnlPercent }` |
| `RMultipleBucket` | `{ range, count, isPositive }` — histogram bucket |
| `RMultipleStats` | `{ distribution, expectancy, avgWinR, avgLossR, totalWithR }` |
| `MoodHeatmapDay` | `{ date, mood }` — daily average mood from journal |
| `DashboardFilterOptions` | `{ from?, to? }` — date range filter params |

---

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/dashboard` | Server | Dashboard page with all widgets, accepts `?range=` search param |
| `/dashboard/loading.tsx` | Server | Skeleton loading state |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `StatCard` | Server-safe | `src/features/dashboard/components/stat-card.tsx` | Single metric card with label, value, subtitle |
| `DateRangeFilter` | Client | `src/features/dashboard/components/date-range-filter.tsx` | Toggle group for 7D/30D/90D/YTD/All |
| `EquityCurve` | Client | `src/features/dashboard/components/equity-curve.tsx` | Recharts AreaChart for cumulative P&L |
| `AssetClassBreakdown` | Client | `src/features/dashboard/components/asset-class-breakdown.tsx` | Recharts BarChart for P&L by asset class |
| `WinLossChart` | Client | `src/features/dashboard/components/win-loss-chart.tsx` | Recharts PieChart for win/loss distribution |
| `RMultipleDistribution` | Client | `src/features/dashboard/components/r-multiple-distribution.tsx` | Histogram of R-multiple buckets |
| `RMultipleStats` | Client | `src/features/dashboard/components/r-multiple-stats.tsx` | Expectancy and R stats display |
| `RecentTradesTable` | Client | `src/features/dashboard/components/recent-trades-table.tsx` | Last 10 closed trades table |
| `MoodHeatmap` | Client | `src/features/dashboard/components/mood-heatmap.tsx` | 2-month calendar colored by journal mood |
| `DashboardCharts` | Client | `src/features/dashboard/components/dashboard-charts.tsx` | Chart layout wrapper |

## Services

| Function | Location | Description |
|----------|----------|-------------|
| `getDashboardData` | `src/features/dashboard/services/queries.ts` | Fetches trades, computes all dashboard metrics for a date range |
| `getMoodHeatmapData` | `src/features/dashboard/services/queries.ts` | Queries journal entries, averages mood per day for 2 months |

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/dashboard/queries.test.ts` | 34 | Dashboard summary, equity curve, asset breakdown, win/loss, R-multiple stats, recent trades, date filtering |
| `tests/features/dashboard/mood-heatmap.test.ts` | — | Mood averaging, deduplication, empty state |
