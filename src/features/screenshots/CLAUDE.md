# Feature: screenshots

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/screenshots/`.

## Description
Screenshot and attachment management for trades — filesystem-based image storage, drag-and-drop upload, thumbnail gallery with lightbox, and cleanup on trade deletion.

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/screenshots/` freely
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
**Shared modules:** `src/shared/components/`
**External packages:** nanoid
**Other features (read-only):** trades (for trade-screenshot linking)

## Safe to Edit (no approval needed)
- `src/features/screenshots/**`
- `tests/**/screenshots/**`
- `docs/requirements/screenshots.md`
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
- [x] Tests passing (206 tests, 12 files)
- [x] ARCHITECTURE.md Feature Log updated

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-13 | `src/lib/db/schema.ts` | Added screenshots table + relations | Plan pre-approved |
| 2026-03-13 | `src/features/trades/components/trade-detail.tsx` | Render ScreenshotGallery + ScreenshotUpload | Plan pre-approved |
| 2026-03-13 | `src/features/trades/services/actions.ts` | Delete screenshot dir on trade delete | Plan pre-approved |
| 2026-03-13 | `src/app/(app)/trades/[id]/page.tsx` | Fetch and pass screenshots to TradeDetail | Plan pre-approved |
| 2026-03-13 | `src/app/api/screenshots/` | New API routes for upload and serve | Plan pre-approved |
