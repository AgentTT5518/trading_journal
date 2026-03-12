# CLAUDE.md

## Setup Checklist
<!-- Complete ALL items before starting any feature work. Remove each [ ] as you go. -->
- [ ] Fill in Project Identity table below
- [ ] Replace `[pm]` with your package manager in Commands and Rules
- [ ] Update Project Structure with your actual folders
- [ ] Add project-specific code conventions (fonts, colors, patterns)
- [ ] Define SECRET_SCAN_PATTERNS for your API keys
- [ ] Verify `.gitignore` includes `.env*` and `!.env.example`
- [ ] Copy `docs/templates/logger-template.ts` to `src/lib/logger.ts`
- [ ] Create ARCHITECTURE.md from template at project root
- [ ] Run `/project-setup` to scaffold additional artifacts (skills, evals, brand docs)
<!-- DELETE this checklist once all items are done — a clean CLAUDE.md = a configured project -->

## Project Identity
| Field | Value |
|-------|-------|
| Name | [Project Name] |
| Description | [1 sentence — what it does, who it serves] |
| Framework | [e.g. Next.js 14 / React 19 + Vite / SvelteKit] |
| Language | TypeScript (strict mode) |
| Styling | [e.g. Tailwind CSS 4.x] |
| Database | [e.g. SQLite via Drizzle / Firebase Firestore / Supabase] |
| AI Provider | [e.g. Claude API / Gemini / OpenAI] |
| Auth | [e.g. Firebase Auth / simple password / none] |
| Package Manager | [npm / pnpm / bun] |
| Test Runner | [e.g. Vitest / Jest] |
| Deployment | [e.g. Vercel / local / AWS] |
| Dev Server Port | [e.g. 3000 / 5173] |

## Commands
```
[pm] dev             # Start dev server
[pm] build           # Production build
[pm] test            # Run all tests
[pm] lint            # Lint check
[pm] typecheck       # TypeScript check
```
<!-- Replace [pm] with your package manager. Add project-specific commands as needed. -->

## Project Structure
```
src/
  app/                    # Pages / routes
  features/               # Feature modules (each has its own CLAUDE.md)
    [feature-name]/
      CLAUDE.md           # Feature boundary rules
      components/ hooks/ services/ types.ts
  shared/                 # Cross-feature code (ask before modifying)
  lib/                    # Project-wide utilities (logger, db, config)
tests/                    # Mirrors src/ structure
  test-results/           # Test run output logs (gitignored)
docs/                     # requirements/, decisions/, templates/
```

## Code Conventions
- No `any` without justification comment
- Functional components with hooks only
- Named exports over default exports
- `async/await` over `.then()` chains
- Every async op wrapped in try-catch with typed errors
- Use project logger (`src/lib/logger.ts`), never bare `console.log`
- File naming: kebab-case for files, PascalCase for components
<!-- Add project-specific conventions below (fonts, colors, patterns) -->

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
<!-- REQUIRED: Add patterns specific to your project's API keys -->
```
SECRET_SCAN_PATTERNS="sk-\|AKIA\|ghp_\|Bearer \|password\s*="
```
<!-- Examples to add per project:
  Firebase: firebase.*apiKey
  Google:   AIza
  Tavily:   tvly-
  Stripe:   sk_live_\|pk_live_
-->

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
  [pm] typecheck && [pm] lint && [pm] test 2>&1 | tee tests/test-results/$(date +%Y%m%d-%H%M%S).log
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
2. PLAN      -> /plan mode -> write docs/requirements/[feature].md
3. DESIGN    -> Update ARCHITECTURE.md with planned changes
4. BUILD     -> Implement + tests + logger (ask before cross-boundary edits)
5. REVIEW    -> Secret scan + tests + self-review checklist
6. DOCUMENT  -> Update ARCHITECTURE.md Feature Log
7. COMMIT    -> Conventional commit -> push feature branch -> PR
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
- `.claude/commands/project-setup.md` — Interactive project setup skill (`/project-setup`)
