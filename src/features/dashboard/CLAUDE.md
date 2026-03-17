# Feature: dashboard

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/dashboard/`.

## Description
Performance overview dashboard — summary cards (total P&L, win rate, profit factor, avg R-multiple, max drawdown, avg win/loss), equity curve, P&L breakdown by asset class, win/loss distribution, R-multiple analytics, recent trades table, date range filtering (7D/30D/90D/YTD/All), and mood heatmap widget (2-month calendar, color-coded by journal mood 1-5).

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/dashboard/` freely
- ASK before modifying: `src/shared/`, `src/app/`, other features, `package.json`, config files, schemas
- When a cross-boundary edit is needed:
  ```
  BOUNDARY ALERT
  File:   [path]
  Reason: [why]
  Change: [what]
  Risk:   [Low/Med/High]
  Proceed? (yes/no)
  ```

## Dependencies
**Shared modules:** `src/shared/components/page-header`, `src/shared/components/empty-state`, `src/shared/components/link-button`, `src/shared/components/pnl-badge`, `src/shared/utils/formatting.ts`
**External packages:** recharts
**Other features (read-only):** `src/features/trades/services/queries.ts` (getTrades), `src/features/trades/types.ts` (TradeWithCalculations, ExitLeg), `src/features/settings/services/queries.ts` (getSettings)

## Safe to Edit (no approval needed)
- `src/features/dashboard/**`
- `tests/**/dashboard/**`
- `docs/requirements/dashboard.md`
- This file

## Always Requires Approval
- `src/features/[OTHER]/*`, `src/shared/*`, `src/app/*`
- `package.json`, `tsconfig.json`, `ARCHITECTURE.md`, `.env.example`
- Database schemas, migrations, CI/CD config

## Progress
- [x] CLAUDE.md created (this file)
- [x] Feature logger created
- [x] Architecture updated
- [x] Implementation complete
- [x] All try-catch blocks use `log.error()`
- [x] Enhancements V2: date range filter, profit factor, max drawdown, avg win/loss, stat card subtitle
- [x] Mood Heatmap widget: 2-month calendar, color-coded by journal mood 1-5, deduplication by day
- [x] Tests passing (34 dashboard tests)
- [x] ARCHITECTURE.md Feature Log updated
- [x] Cross-boundary edits logged below

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-15 | `src/shared/components/sidebar.tsx` | Moved Dashboard to first position, enabled link | Plan pre-approved |
| 2026-03-15 | `src/app/(app)/dashboard/page.tsx` | New route (server component) | Plan pre-approved |
| 2026-03-15 | `src/app/(app)/dashboard/loading.tsx` | Skeleton loader | Plan pre-approved |
| 2026-03-15 | `package.json` | Added recharts dependency | Plan pre-approved |
| 2026-03-15 | `ARCHITECTURE.md` | Added dashboard to component map, routes, feature log | Plan pre-approved |
| 2026-03-16 | `src/app/(app)/dashboard/page.tsx` | Added date range filter via searchParams, new metric cards | Plan pre-approved |
| 2026-03-16 | `ARCHITECTURE.md` | Updated component map, routes, feature log for Enhancements V2 | Plan pre-approved |
| 2026-03-17 | `src/app/(app)/dashboard/page.tsx` | Added getMoodHeatmapData() call and MoodHeatmap widget render | Plan pre-approved |
| 2026-03-17 | `ARCHITECTURE.md` | Added MoodHeatmap to component map and feature log | Plan pre-approved |
