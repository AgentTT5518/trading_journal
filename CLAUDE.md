# CLAUDE.md

## Project Identity
| Field | Value |
|-------|-------|
| Name | Trading Journal |
| Description | Local-first swing trading journal for stocks, options, and crypto — trade logging, P&L tracking, psychology, and analytics for a solo trader |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui (Base UI) |
| Database | SQLite via Drizzle ORM + better-sqlite3 |
| AI Provider | None |
| Auth | None (solo user, localhost only) |
| Package Manager | npm |
| Test Runner | Vitest |
| Deployment | Local (localhost) |
| Dev Server Port | 5180 |

## Commands
```
npm run dev             # Start dev server (port 5180)
npm run build           # Production build
npm run test            # Run all tests
npm run lint            # Lint check
npm run typecheck       # TypeScript check
npm run db:push         # Push schema to SQLite
npm run db:studio       # Open Drizzle Studio
```

## Project Structure
```
src/
  app/                    # Pages / routes
    (app)/                # Shared sidebar layout group
      trades/             # Trade CRUD pages
  components/ui/          # shadcn/ui primitives
  features/               # Feature modules (each has its own CLAUDE.md)
    trades/               # Trade logging, P&L, list, form, detail
      CLAUDE.md           # Feature boundary rules
      components/ services/ types.ts validations.ts logger.ts
  shared/                 # Cross-feature code (ask before modifying)
    components/           # sidebar, page-header, empty-state, pnl-badge, link-button
    utils/                # formatCurrency, formatPercent, formatDate
  lib/                    # Project-wide utilities
    db/                   # Drizzle client + schema
    logger.ts config.ts ids.ts errors.ts
data/                     # SQLite database (gitignored)
tests/                    # Mirrors src/ structure
  test-results/           # Test run output logs (gitignored)
docs/                     # requirements/, decisions/, templates/
Plan/
  Planning/               # Active plans (working drafts during planning)
  Archive/                # Completed plans (moved here after development)
```

## Code Conventions
- No `any` without justification comment
- Functional components with hooks only
- Named exports over default exports
- `async/await` over `.then()` chains
- Every async op wrapped in try-catch with typed errors
- Use project logger (`src/lib/logger.ts`), never bare `console.log`
- File naming: kebab-case for files, PascalCase for components
- Fonts: Geist Sans + Geist Mono (via next/font)
- shadcn/ui uses Base UI (not Radix) — use `render` prop instead of `asChild`
- Dates: stored as UTC ISO 8601 strings, displayed in local time on the client
- IDs: nanoid(12) text primary keys
- P&L: never stored, always computed at query time
- Trade status: derived from exitDate presence (no stored column)
- Server Actions for mutations, no API routes (Phase 1)

## Git Workflow
- Branches: `feature/[short-desc]`, `fix/[short-desc]`
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
- Never commit to `main` directly
- Run full test suite before every commit

### Parallel Development (2+ developers on same repo)
- Use git worktrees: `git worktree add ../project-[feature] feature/[name]`
- One Claude Code session per worktree — never share
- **Shared contracts first** — agree on types/interfaces, merge to `main` before feature work
- **Lock shared resources** — only one person modifies `src/app/` routes or migrations at a time
- Rebase on `main` before opening PR
- Full guide: `docs/parallel-development.md`

## Secret Patterns
```
SECRET_SCAN_PATTERNS="sk-\|AKIA\|ghp_\|Bearer \|password\s*="
```

---

## MANDATORY RULES

### Rule 1: Secret Protection
Before every commit, scan for exposed secrets:
```bash
grep -rn "$SECRET_SCAN_PATTERNS" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.env" src/ tests/ . 2>/dev/null | grep -v node_modules | grep -v ".env.example"
```
- All secrets in `.env.local` only (never committed)
- `.env*` (except `.env.example`) MUST be in `.gitignore`
- Verify `.gitignore` includes: `.env*`, `!.env.example`
- `.env.example` must exist with placeholders for all required vars
- Secrets only in server-side code (API routes, server components) — never in client bundle
- New env vars -> add to `.env.example` immediately
- Before deploy: verify build output and logs do not contain secrets
- **If a secret is detected, STOP. Do not commit. Alert the user.**

### Rule 2: Test & Review Every Feature
- Write tests DURING implementation, not after
- Run before every commit and save results:
  ```bash
  npm run typecheck && npm run lint && npm run test 2>&1 | tee tests/test-results/$(date +%Y%m%d-%H%M%S).log
  ```
- Test result logs saved to `tests/test-results/` (add this directory to `.gitignore`)
- Self-review checklist:
  - Matches requirements in `docs/requirements/`?
  - All new code paths tested? Error cases handled?
  - No hardcoded config values? No bare `console.log`?
  - No unjustified `any` types? Secret scan passed (Rule 1)?
- **If tests fail, fix before moving on. Never skip.**

### Rule 3: Error Logging
- Logger factory lives at `src/lib/logger.ts` (create from `docs/templates/logger-template.ts`)
- **Every feature MUST create its own scoped logger:**
  ```
  src/features/[name]/logger.ts:
    import { createLogger } from '@/lib/logger';
    export const log = createLogger('[name]');
  ```
- All feature files import from their local `./logger`, not from `src/lib/logger` directly
- Every try-catch -> `log.error('description', error)`
- Every API route -> log entry + errors
- Every external service call -> log failures with context
- NEVER log secrets, passwords, or tokens
- No bare `console.log/error/warn` in production code

### Rule 4: Update ARCHITECTURE.md After Every Feature
- Lives at project root
- After each feature: update Component Map, API Endpoints, Feature Log
- Always update "Last updated" date

### Rule 5: Feature Boundary — HARD BLOCK
**NEVER edit files outside your current feature folder without user approval.**
- ONLY modify files within `src/features/[current-feature]/` freely
- ASK before touching: other features, `src/shared/`, `src/app/`, `package.json`, config files, schemas
- Use this format:
  ```
  BOUNDARY ALERT
  File:   [path]
  Reason: [why]
  Change: [what]
  Risk:   [Low/Med/High]
  Proceed? (yes/no)
  ```
- Log approved cross-boundary edits in feature's SCRATCHPAD.md

---

## Feature Workflow
```
1. BOUNDARY  -> Copy docs/templates/FEATURE-CLAUDE.md to src/features/[name]/CLAUDE.md
              -> Replace [FEATURE_NAME] with actual name, fill in Owner + Description
2. PLAN      -> Create Plan/Planning/[feature]/ folder
              -> Copy docs/templates/plan-template.md -> plan.md
              -> Fill in goal, approach, file list, open questions
3. REVIEW    -> User reviews plan, adds feedback / asks questions
4. APPROVE   -> User gives go-ahead to implement
5. DESIGN    -> Update ARCHITECTURE.md with planned changes
6. BUILD     -> Implement + tests + logger (ask before cross-boundary edits)
7. TEST      -> Secret scan + tests + self-review checklist
8. COMPLETE  -> Finalize docs/requirements/[feature].md and docs/decisions/
              -> Update ARCHITECTURE.md Feature Log
              -> Move plan from Plan/Planning/ to Plan/Archive/
9. COMMIT    -> Conventional commit -> push feature branch -> PR
```

## Reference Docs
- `ARCHITECTURE.md` — Living system design
- `docs/github-workflow-guide.md` — Step-by-step feature development workflow
- `docs/project-setup-guide.md` — Decision guide for artifact selection (skills, evals, brand docs)
- `docs/skills-guide.md` — How to create custom Claude Code skills
- `docs/evals-guide.md` — How to set up AI output quality testing
- `docs/brand-voice-guide.md` — How to define writing style and brand voice
- `docs/requirements/` — Feature specs
- `docs/decisions/` — Architecture Decision Records
- `docs/templates/FEATURE-CLAUDE.md` — Feature boundary template
- `docs/templates/logger-template.ts` — Structured logger implementation
- `docs/templates/skill-template.md` — Custom skill starter file
- `docs/templates/eval-template/` — Eval test structure starter (rubric + test cases)
- `docs/templates/brand/` — Brand identity, style guide, and tone matrix templates
- `docs/parallel-development.md` — Multi-developer worktree workflow
- `docs/command-policy.md` — Command permission tiers for Claude Code operations
- `docs/templates/plan-template.md` — Plan file template
- `Plan/Planning/` — Active feature plans (working drafts)
- `Plan/Archive/` — Completed feature plans
- `.claude/commands/project-setup.md` — Interactive project setup skill (`/project-setup`)
