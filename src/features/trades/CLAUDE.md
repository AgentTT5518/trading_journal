# Feature: trades

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/trades/`.

## Description
Core trade logging — CRUD for trades, P&L calculations, trade list, form, and detail views. Supports stocks (Phase 1), options and crypto (Phase 2+).

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/trades/` freely
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
**External packages:** zod, nanoid, sonner
**Other features (read-only):** none

## Safe to Edit (no approval needed)
- `src/features/trades/**`
- `tests/**/trades/**`
- `docs/requirements/trades.md`
- This file

## Always Requires Approval
- `src/features/[OTHER]/*`, `src/shared/*`, `src/app/*`
- `package.json`, `tsconfig.json`, `ARCHITECTURE.md`, `.env.example`
- Database schemas, migrations, CI/CD config

## Progress
- [x] CLAUDE.md created (this file)
- [x] Feature logger created
- [x] Requirements written (`docs/requirements/trades.md`)
- [x] Architecture updated (`ARCHITECTURE.md`)
- [x] Implementation complete (Phase 1: CRUD + P&L)
- [x] Tests passing (60 tests across 5 files)
- [x] ARCHITECTURE.md Feature Log updated

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
