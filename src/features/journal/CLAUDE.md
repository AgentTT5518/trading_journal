# Feature: journal

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/journal/`.

## Description
Free-form daily trading diary — pre-market prep, post-market reflections, market observations, mood/energy tracking, and optional trade linking. Fills the gap between structured Reviews and raw trade logs.

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/journal/` freely
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
**Other features (read-only):** trades (for date-based trade queries and linking)

## Safe to Edit (no approval needed)
- `src/features/journal/**`
- `tests/**/journal/**`
- `docs/requirements/journal.md`
- This file

## Always Requires Approval
- `src/features/[OTHER]/*`, `src/shared/*`, `src/app/*`
- `package.json`, `tsconfig.json`, `ARCHITECTURE.md`, `.env.example`
- Database schemas, migrations, CI/CD config

## Progress
- [x] CLAUDE.md created (this file)
- [x] Feature logger created: `src/features/journal/logger.ts`
- [x] Requirements written (in plan)
- [x] Architecture updated
- [x] Implementation complete
- [x] All try-catch blocks use `log.error()`
- [x] All API routes log entry + errors
- [x] All external service calls log failures
- [x] Tests passing (48 tests: 23 validation + 10 queries + 15 actions)
- [x] Secret scan passed
- [x] Self-review completed
- [x] ARCHITECTURE.md Feature Log updated
- [x] Cross-boundary edits logged below

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-15 | `src/lib/db/schema.ts` | Added journalEntries + journalTrades tables + relations | Plan pre-approved |
| 2026-03-15 | `src/shared/components/sidebar.tsx` | Enable Journal nav item | Plan pre-approved |
| 2026-03-15 | `src/app/(app)/journal/` | New routes for journal CRUD (6 files) | Plan pre-approved |
