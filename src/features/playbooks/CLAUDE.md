# Feature: playbooks

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/playbooks/`.

## Description
Tags and playbook management — predefined and custom tags grouped by category (strategy, market condition, timeframe, instrument, execution, mistake), tag CRUD, trade-tag linking, and playbook definitions.

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/playbooks/` freely
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
**Other features (read-only):** trades (for trade-tag linking)

## Safe to Edit (no approval needed)
- `src/features/playbooks/**`
- `tests/**/playbooks/**`
- `docs/requirements/playbooks.md`
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
- [x] Implementation complete (Phase 7a: Tags)
- [x] Implementation complete (Phase 7b: Playbooks)
- [x] Tests passing (184 tests, 9 files)
- [x] ARCHITECTURE.md Feature Log updated

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-13 | `src/lib/db/schema.ts` | Added tags + trade_tags tables + relations | Plan pre-approved |
| 2026-03-13 | `src/shared/components/sidebar.tsx` | Enable Tags nav item | Plan pre-approved |
| 2026-03-13 | `src/features/trades/` | Add TagSelector to forms, badges to detail, sync in actions | Plan pre-approved |
| 2026-03-13 | `src/app/(app)/tags/` | New route for tag manager | Plan pre-approved |
| 2026-03-13 | `package.json` | Add db:seed script | Plan pre-approved |
| 2026-03-13 | `src/lib/db/schema.ts` | Added playbooks table + playbookId FK on tags + relations | Plan pre-approved |
| 2026-03-13 | `src/shared/components/sidebar.tsx` | Enable Playbooks nav item | Plan pre-approved |
| 2026-03-13 | `src/app/(app)/playbooks/` | New routes for playbook CRUD | Plan pre-approved |
