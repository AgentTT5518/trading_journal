# Feature: correlation-analysis

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/correlation-analysis/`.

## Description
Correlation analysis between trade psychology fields (mood, confidence, FOMO, etc.) and P&L outcomes — Pearson correlation matrix, scatter plots, boolean field comparisons, and auto-generated insights.

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/correlation-analysis/` freely
- ASK before modifying: `src/shared/`, `src/app/`, other features, `package.json`, config files, schemas

## Dependencies
**Shared modules:** `src/shared/utils/formatting.ts`, `src/components/ui/`
**External packages:** recharts
**Other features (read-only):** `src/features/trades/types.ts`, `src/features/trades/services/queries.ts`

## Safe to Edit (no approval needed)
- `src/features/correlation-analysis/**`
- `tests/**/correlation-analysis/**`
- This file

## Always Requires Approval
- `src/features/[OTHER]/*`, `src/shared/*`, `src/app/*`
- `package.json`, `tsconfig.json`, `ARCHITECTURE.md`, `.env.example`
- Database schemas, migrations, CI/CD config

## Progress
- [x] CLAUDE.md created (this file)
- [x] Feature logger created
- [x] Implementation complete
- [x] Tests passing (333 tests)
- [x] Cross-boundary edits logged below
- [x] ARCHITECTURE.md Feature Log updated

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-24 | `src/app/(app)/analytics/page.tsx` | Added CorrelationDashboard to analytics page | Plan pre-approved |
