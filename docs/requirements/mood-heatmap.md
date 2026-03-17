# Feature Requirements: Mood Heatmap

**Phase:** Dashboard Widget (V3)
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-17

---

## Overview

The mood heatmap is a dashboard widget that displays a 2-month calendar view of the trader's daily mood. Each day is color-coded by the mood score recorded in the journal (1–5 scale). It gives a quick visual read of psychological patterns alongside trade performance.

---

## User Stories

### US-1 — View mood calendar at a glance
**As a trader, I want to see my mood history as a color-coded calendar so I can spot emotional patterns.**

- Shows the current month and the previous month
- Each day is colored by mood score (1 = dark red → 5 = dark green)
- Days with no journal entry (or no mood value) are shown in a neutral gray
- When multiple journal entries exist for the same day, the most recent entry's mood wins

**Acceptance criteria:**
- [x] Current month and previous month are always shown
- [x] Colors map correctly: 1 → red-600, 2 → orange-400, 3 → yellow-300, 4 → green-400, 5 → green-600
- [x] Days without mood data render as neutral (bg-muted)
- [x] Deduplication takes the most recently created entry per day

### US-2 — Read mood legend
**As a trader, I want a legend so I can interpret the color scale.**

- A legend row below the calendar shows mood scores 1–5 with labels (Terrible → Great)
- A "No data" swatch is also shown

**Acceptance criteria:**
- [x] All 5 mood levels shown in legend with correct colors and labels
- [x] "No data" shown in neutral gray

### US-3 — Empty state
**As a trader, I want a clear message when no mood data exists yet.**

- If no journal entries with mood values exist in the 2-month window, display "No journal entries with mood data yet."

**Acceptance criteria:**
- [x] Empty state message renders when moodData array is empty

---

## Data Model

No schema changes — reads from existing `journal_entries` table.

| Column | Type | Used for |
|--------|------|----------|
| `date` | text (YYYY-MM-DD) | Calendar day key |
| `mood` | integer (1–5, nullable) | Color tier |
| `createdAt` | text (ISO 8601) | Deduplication — latest per day wins |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `MoodHeatmap` | Client | `src/features/dashboard/components/mood-heatmap.tsx` | 2-month calendar grid with color-coded mood tiles and legend |

## Service

| Function | Location | Description |
|----------|----------|-------------|
| `getMoodHeatmapData` | `src/features/dashboard/services/queries.ts` | Fetches journal entries from past 2 months, deduplicates by date (latest wins), returns `MoodHeatmapDay[]` |

---

## Mood Config

| Score | Label | Tailwind Class |
|-------|-------|----------------|
| 1 | Terrible | `bg-red-600` |
| 2 | Bad | `bg-orange-400` |
| 3 | Neutral | `bg-yellow-300` |
| 4 | Good | `bg-green-400` |
| 5 | Great | `bg-green-600` |

---

## Routes

No new routes — widget is embedded in `/dashboard`.

---

## Out of Scope

- Clicking a day to navigate to that journal entry (future enhancement)
- Mood trend line chart
- Correlation between mood and P&L

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/dashboard/mood-heatmap.test.ts` | 5 | Empty data, multiple entries, deduplication, null mood filtering, error propagation |
