# Feature: goals

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/goals/`.

## Description
Goal tracking — set monthly/weekly P&L targets, max loss limits, trade count goals, and win rate goals. Progress bars computed from trade data, with pace-based alerts.

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/goals/` freely
- ASK before modifying: `src/shared/`, `src/app/`, other features, `package.json`, config files, schemas

## Dependencies
**Shared modules:** `src/shared/components/page-header.tsx`, `src/shared/components/empty-state.tsx`, `src/shared/utils/formatting.ts`, `src/components/ui/card.tsx`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/select.tsx`, `src/components/ui/dialog.tsx`
**External packages:** zod, lucide-react
**Other features (read-only):** `src/features/trades/services/queries.ts`, `src/features/trades/types.ts`

## Safe to Edit (no approval needed)
- `src/features/goals/**`
- `tests/**/goals/**`
- `docs/requirements/goals.md`
- This file

## Progress
- [x] CLAUDE.md created (this file)
- [x] Feature logger created
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Cross-boundary edits logged below

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-24 | `src/lib/db/schema.ts` | Added goals table | Plan pre-approved |
| 2026-03-24 | `src/shared/components/sidebar.tsx` | Add Goals nav item | Plan pre-approved |
| 2026-03-24 | `src/app/(app)/goals/page.tsx` | New goals route | Plan pre-approved |
| 2026-03-24 | `src/app/(app)/goals/loading.tsx` | Loading skeleton | Plan pre-approved |
