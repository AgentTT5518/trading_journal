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
**External packages:** zod, nanoid, sonner, lucide-react (Search icon in TradeFilters)
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
- [x] Implementation complete (Phase 1: CRUD + P&L — stock only)
- [x] Implementation complete (Phase 2: Options, Crypto, Partial Exits)
  - Options P&L with contractMultiplier, Greeks, expiry, DTE
  - Crypto net P&L with exchange fees subtraction
  - Exit legs wired (partial/closed status, per-leg P&L)
  - Spread linking via spreadId (grouped in TradeList)
  - Conditional form sections by asset class
- [x] Tests passing (114 tests across 5 files)
- [x] ARCHITECTURE.md Feature Log updated
- [x] Enhancements V2: TradeFilters + FilterableTradeList (search by ticker, filter by status/asset class)

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-13 | `src/lib/db/schema.ts` | Added 17 options/spread columns to trades table | Plan pre-approved |
| 2026-03-13 | `ARCHITECTURE.md` | Updated component map, data model, API endpoints, key patterns, feature log for Phase 2 | Plan pre-approved |
| 2026-03-16 | `src/app/(app)/trades/page.tsx` | Replaced TradeList with FilterableTradeList | Plan pre-approved |
| 2026-03-16 | `ARCHITECTURE.md` | Added FilterableTradeList + TradeFilters to component map | Plan pre-approved |
