# Feature: reviews

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/reviews/`.

## Description
Structured trading reviews (daily/weekly/monthly) — date range selection, auto-populated trade summaries, computed metrics (win rate, P&L, best/worst), grade assignment, lessons learned, and goals tracking.

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/reviews/` freely
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
**Shared modules:** `src/shared/components/`, `src/shared/utils/formatting.ts`
**External packages:** zod, nanoid
**Other features (read-only):** trades (for date-range queries and metrics)

## Safe to Edit (no approval needed)
- `src/features/reviews/**`
- `tests/**/reviews/**`
- `docs/requirements/reviews.md`
- This file

## Always Requires Approval
- `src/features/[OTHER]/*`, `src/shared/*`, `src/app/*`
- `package.json`, `tsconfig.json`, `ARCHITECTURE.md`, `.env.example`
- Database schemas, migrations, CI/CD config

## Progress
- [x] CLAUDE.md created (this file)
- [x] Feature logger created
- [x] Requirements written
- [x] Architecture updated
- [x] Implementation complete
- [x] Tests passing (505 tests total)
- [x] ARCHITECTURE.md Feature Log updated

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-13 | `src/lib/db/schema.ts` | Added reviews + review_trades tables + relations | Plan pre-approved |
| 2026-03-13 | `src/shared/components/sidebar.tsx` | Enable Reviews nav item | Plan pre-approved |
| 2026-03-13 | `src/app/(app)/reviews/` | New routes for review CRUD | Plan pre-approved |
