# Feature: settings

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/settings/`.

## Description
Application settings — Trader Profile, Trade Defaults, Display Preferences (including theme), and Data Management (CSV/JSON export, CSV import, clear all trades). Settings are stored in a single-row SQLite `settings` table (`id = 'default'`).

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/settings/` freely
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
**External packages:** zod, next-themes, sonner
**Other features (read-only):** trades (for clearAllTrades + CSV export/import)

## Safe to Edit (no approval needed)
- `src/features/settings/**`
- `tests/**/settings/**`
- `docs/requirements/settings.md`
- This file

## Always Requires Approval
- `src/features/[OTHER]/*`, `src/shared/*`, `src/app/*`
- `package.json`, `tsconfig.json`, `ARCHITECTURE.md`, `.env.example`
- Database schemas, migrations, CI/CD config

## Progress
- [x] CLAUDE.md created (this file)
- [x] Feature logger created: `src/features/settings/logger.ts`
- [x] Types + validations
- [x] Services: queries.ts + actions.ts
- [x] Components: profile-form, trade-defaults-form, display-preferences-form, data-management, settings-tabs
- [x] Routes: settings/page.tsx, settings/loading.tsx, api/export/csv, api/export/json
- [x] Sidebar: Settings nav item enabled
- [x] Tests passing
- [x] ARCHITECTURE.md updated

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-15 | `src/lib/db/schema.ts` | Added settings table | Plan pre-approved |
| 2026-03-15 | `src/app/layout.tsx` | Added ThemeProvider + suppressHydrationWarning | Plan pre-approved |
| 2026-03-15 | `src/shared/components/sidebar.tsx` | Enable Settings nav item | Plan pre-approved |
| 2026-03-15 | `ARCHITECTURE.md` | Updated component map, data model, API routes, feature log | Plan pre-approved |
