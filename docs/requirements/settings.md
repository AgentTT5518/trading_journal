# Feature: Settings

**Status:** Implemented
**Date:** 2026-03-15
**Branch:** Setup_Settings

## Goal
Provide a `/settings` page with 4 tabbed sections so the solo trader can configure app behavior, trade defaults, display preferences, and manage their data.

## Sections

### 1. Trader Profile
- `traderName` (text, ≤100 chars)
- `timezone` (IANA tz string, select list)
- `currency` (3-letter ISO code, select list)
- `startingCapital` (real, nullable — `null` = unset to avoid misleading 0-baseline P&L)

### 2. Trade Defaults
- `defaultCommission` (real, ≥0)
- `defaultRiskPercent` (real, 0.01–100)
- `positionSizingMethod` (enum: `fixed-dollar | percent-equity | kelly`)

### 3. Display Preferences
- `dateFormat` (stored, not yet applied to formatDate — known limitation)
- `theme` (enum: `light | dark | system`)
  - On save: DB upsert first; client-side `setTheme()` called on confirmed success

### 4. Data Management
- **Export CSV** — GET `/api/export/csv` with `Content-Disposition: attachment; filename="trades.csv"` (can't set headers from Server Actions)
- **Export JSON** — GET `/api/export/json` same pattern
- **Import CSV** — Server Action receiving FormData with File; partial import (invalid rows skipped, errors reported per row)
  - Required columns: `ticker`, `assetClass`, `direction`, `entryDate`, `entryPrice`, `positionSize`
  - Optional columns: `exitDate`, `exitPrice`, `commissions`, `fees`, `notes`
- **Clear All Trades** — Dialog requiring user to type `DELETE` before confirming

## Storage
Single-row SQLite table `settings` with `id='default'`. Upsert on every save (`onConflictDoUpdate`). Row is never deleted.

## Known Limitations
- `dateFormat` is stored in DB but not wired into `formatDate()` in `src/shared/utils/formatting.ts`. Wiring would require cross-feature context propagation; deferred.
- Theme is applied client-side; SSR will render in system/default theme until hydration.

## Test Coverage
- `tests/features/settings/validations.test.ts` — Zod schema unit tests (settingsSchema + importedTradeSchema)
- `tests/features/settings/queries.test.ts` — getSettings: row found, not found, DB error
- `tests/features/settings/actions.test.ts` — updateSettings validation + DB error; clearAllTrades confirmation check
- `tests/features/settings/api.test.ts` — CSV + JSON route headers, content, error handling
- `tests/features/settings/import.integration.test.ts` — full CSV parse → validate → insert flow
