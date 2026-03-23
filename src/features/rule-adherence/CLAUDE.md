# Feature: rule-adherence

## Owner
Claude Code

## Scope
This feature owns all files within `src/features/rule-adherence/`.

## Description
Rule adherence scoring — structured playbook rules (entry/exit/sizing) with per-trade checklists, adherence scoring, and analytics showing correlation between rule-following and P&L outcomes.

## Boundary Rules
**HARD BLOCK: Do NOT edit files outside this folder without explicit user approval.**

- ONLY modify files within `src/features/rule-adherence/` freely
- ASK before modifying: `src/shared/`, `src/app/`, other features, `package.json`, config files, schemas

## Dependencies
**Shared modules:** `src/shared/utils/formatting.ts`, `src/components/ui/`
**External packages:** recharts, zod
**Other features (read-only):** `src/features/trades/types.ts`, `src/features/playbooks/types.ts`

## Safe to Edit (no approval needed)
- `src/features/rule-adherence/**`
- `tests/**/rule-adherence/**`
- This file

## Always Requires Approval
- `src/features/[OTHER]/*`, `src/shared/*`, `src/app/*`
- `package.json`, `tsconfig.json`, `ARCHITECTURE.md`, `.env.example`
- Database schemas, migrations, CI/CD config

## Progress
- [x] CLAUDE.md created (this file)
- [x] Feature logger created
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Cross-boundary edits logged below

## Cross-Boundary Edit Log
| Date | File | Change | Approved By |
|------|------|--------|-------------|
| 2026-03-23 | `src/lib/db/schema.ts` | Added playbookRules + tradeRuleChecks tables + relations | Plan pre-approved |
