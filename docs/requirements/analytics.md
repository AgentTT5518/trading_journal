# Feature Requirements: Analytics (P&L Heatmap)

**Phase:** Analytics (V1)
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-17

---

## Overview

The analytics feature provides a dedicated `/analytics` route with a P&L calendar heatmap. Each day is color-coded by net P&L intensity — 4 discrete green tiers for profit, 4 red tiers for loss, gray for no trades, and a distinct color for breakeven. Clicking a day navigates to the trade list filtered by that date.

---

## User Stories

### US-1 — View P&L calendar heatmap
**As a trader, I want to see my daily P&L as a color-coded calendar so I can spot profit/loss streaks and patterns.**

- Shows the current month and the previous month as 7-column (Sun–Sat) grids
- Each day cell is colored by net P&L relative to the best and worst days in the period
- Days with no closed trades are shown in neutral gray

**Acceptance criteria:**
- [x] Current month and previous month always shown
- [x] Green intensity (4 tiers) for profitable days; red intensity (4 tiers) for losing days
- [x] Breakeven days (net P&L = 0) shown in a distinct slate color
- [x] No-trade days shown as neutral gray
- [x] Color intensity is relative (pnl / maxProfit or pnl / maxLoss), not absolute

### US-2 — Hover tooltip
**As a trader, I want to hover over a day cell to see a summary of that day's trades.**

- Tooltip shows: date, total net P&L (formatted as currency), trade count, and "Click to view" hint

**Acceptance criteria:**
- [x] Tooltip appears on mouse enter, disappears on mouse leave
- [x] P&L formatted correctly (green for profit, red for loss)
- [x] Trade count shown (e.g., "2 trades")

### US-3 — Click to filter trades
**As a trader, I want to click a day with trades to see just those trades.**

- Clicking a day cell with at least 1 trade navigates to `/trades?date=YYYY-MM-DD`

**Acceptance criteria:**
- [x] Days with trades are keyboard-accessible (tabIndex=0, role=button)
- [x] Click navigates to trades list with date filter applied
- [x] Days with no trades are not interactive

### US-4 — Color legend
**As a trader, I want a legend to interpret the heatmap color scale.**

- Legend shows: Large Loss → Small Loss → Breakeven → Small Profit → Large Profit, plus No Trades

**Acceptance criteria:**
- [x] All tiers represented in legend

### US-5 — Loading and error states
**As a trader, I want a loading skeleton while data fetches and a clear error message if it fails.**

**Acceptance criteria:**
- [x] `/analytics/loading.tsx` renders skeleton
- [x] `/analytics/error.tsx` renders error boundary with retry button

---

## Data Model

No schema changes — computed from existing `trades` and `exit_legs` tables.

| Computed field | Description |
|----------------|-------------|
| `DailyPnl` | `{ date: string; netPnl: number; tradeCount: number }` — net P&L summed per calendar day |
| `CalendarDay` | `{ date: string \| null; dailyPnl: DailyPnl \| null }` — one cell in the 7-col grid |
| `HeatmapMonth` | `{ label: string; weeks: CalendarDay[][] }` — a month with its week rows |
| `HeatmapData` | `{ months: HeatmapMonth[]; maxProfit: number; maxLoss: number }` — full payload |

P&L attribution: per-exit-leg when legs exist (same as equity curve); top-level exitPrice for simple trades.

---

## Color Tiers

| Condition | Tiers | Color classes |
|-----------|-------|---------------|
| Profit | 4 tiers (0–25%, 25–50%, 50–75%, 75–100% of maxProfit) | `bg-green-200`, `bg-green-400`, `bg-green-600`, `bg-green-800` |
| Loss | 4 tiers (0–25%, 25–50%, 50–75%, 75–100% of |maxLoss|) | `bg-red-200`, `bg-red-400`, `bg-red-600`, `bg-red-800` |
| Breakeven | n/a | `bg-slate-400` |
| No trades | n/a | `bg-muted` |

---

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/analytics` | Server | P&L heatmap page — fetches data server-side, renders PnlCalendarHeatmap |
| `/analytics/loading.tsx` | Server | Skeleton loading state |
| `/analytics/error.tsx` | Client | Error boundary with retry |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `PnlCalendarHeatmap` | Client | `src/features/analytics/components/pnl-calendar-heatmap.tsx` | 2-month calendar grid composing cells and legend |
| `PnlHeatmapCell` | Client | `src/features/analytics/components/pnl-heatmap-cell.tsx` | Single day cell with color + tooltip + click navigation |
| `PnlHeatmapLegend` | Server-safe | `src/features/analytics/components/pnl-heatmap-legend.tsx` | Color scale legend |

## Services

| Function | Location | Description |
|----------|----------|-------------|
| `computeDailyPnl` | `src/features/analytics/services/queries.ts` | Pure — aggregates per-leg P&L into `DailyPnl[]` |
| `buildHeatmapData` | `src/features/analytics/services/queries.ts` | Pure — builds 2-month grid from `DailyPnl[]` |
| `getHeatmapData` | `src/features/analytics/services/queries.ts` | Async wrapper — fetches trades and calls pure functions |
| `getPnlColorClass` | `src/features/analytics/utils/color-tiers.ts` | Maps pnl + max values to Tailwind color class |

---

## Out of Scope (V1)

- Date range selector on analytics page (always shows current + previous month)
- Win rate or other metrics on the analytics page
- Mobile tooltip support (touch events)
- Additional chart types

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/analytics/queries.test.ts` | 22 | computeDailyPnl, buildHeatmapData: empty, single trade, per-leg attribution, month boundaries, January edge case |
| `tests/features/analytics/color-tiers.test.ts` | 12 | getPnlColorClass/getPnlColorTier: all tiers, breakeven, null, zero max |
