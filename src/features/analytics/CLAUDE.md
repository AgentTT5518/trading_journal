# Feature: analytics

## Owner
unassigned

## Scope
This feature owns all files within `src/features/analytics/`.

## Description
P&L Calendar Heatmap — displays the latest 2 months as a calendar grid, coloring each day green (profitable), red (losing), or gray (no trades) based on aggregated net P&L from closed trades.

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/analytics/` freely
- ASK before modifying: `src/shared/`, `src/app/`, other features, `package.json`, config files, schemas

## Dependencies
**Shared modules:** `src/shared/utils/formatting.ts`, `src/shared/components/page-header.tsx`, `src/components/ui/card.tsx`, `src/components/ui/button.tsx`
**External packages:** none
**Other features (read-only):** `src/features/trades/services/queries.ts`, `src/features/trades/types.ts`

## Safe to Edit (no approval needed)
- `src/features/analytics/**`
- `tests/**/analytics/**`
- `docs/requirements/analytics.md`
- This file

## Progress
- [x] CLAUDE.md created
- [x] Feature logger created
- [x] Implementation complete
- [x] Tests passing
- [x] Cross-boundary edits logged below

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-17 | `src/shared/components/sidebar.tsx` | Add Analytics nav item (CalendarDays icon) | User (plan approval) |
| 2026-03-17 | `src/app/(app)/analytics/page.tsx` | New analytics route | User (plan approval) |
| 2026-03-17 | `src/app/(app)/analytics/loading.tsx` | Loading skeleton | User (plan approval) |
| 2026-03-17 | `src/app/(app)/analytics/error.tsx` | Error boundary | User (plan approval) |
