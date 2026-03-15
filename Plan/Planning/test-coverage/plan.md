# Plan: Achieve 100% Test Coverage

**Status:** Planning
**Created:** 2026-03-15
**Feature Branch:** `feature/achieve-100-test-coverage`

---

## Goal / Problem Statement

Current test coverage sits at **89.48% statements / 82.43% branch / 78.48% functions / 90.46% lines**. The goal is to reach 100% across all metrics. This improves confidence in refactoring and catches regressions early for a solo-trader app where bugs could mean incorrect P&L data.

## Current Coverage Gaps

| File | Stmts | Lines | Uncovered |
|------|-------|-------|-----------|
| `screenshots/services/storage.ts` | 34.48% | 34.48% | Lines 13-50, 60 — all file I/O functions |
| `lib/db/schema.ts` | 47.72% | 61.76% | Relation definitions, defaults, constraints |
| `lib/logger.ts` | 75% | 80% | `warn()` and `debug()` methods (lines 47, 49) |
| `trades/services/actions.ts` | 77.06% | 76.47% | `updateTrade()`, `deleteTrade()`, exit leg edge cases (lines 139, 263-321) |
| `dashboard/services/queries.ts` | 93.15% | 92.42% | `getDashboardData()` error path (lines 153-158) |
| `reviews/services/actions.ts` | 96% | 95.91% | `deleteReview()` error path (lines 138-139) |
| `settings/services/actions.ts` | 97.1% | 96.82% | CSV import insert failure (lines 136-137) |
| `playbooks/services/actions.ts` | 100% stmts | — | 2 branch gaps (lines 27, 103) |
| `journal/services/actions.ts` | 100% stmts | — | 1 branch gap (line 16) |
| `api/export/csv/route.ts` | 100% stmts | — | 1 branch gap (line 26) |

## Proposed Approach

Tackle gaps from largest to smallest. Each phase is independent and can be committed separately.

### Phase 1: screenshots/storage.ts (biggest gap — ~65% uncovered)
Mock `node:fs/promises` (mkdir, writeFile, readFile, unlink, rm) to test:
- `ensureTradeDir()` — creates directory, handles existing dir, returns correct path
- `saveFile()` — writes buffer, generates nanoid filename, logs info
- `readFileFromDisk()` — reads and returns buffer, throws on missing file
- `deleteFile()` — deletes file, logs info, handles errors gracefully with warning log
- `deleteTradeScreenshotDir()` — recursive delete, logs success, handles errors gracefully

**Test file:** `tests/features/screenshots/storage.test.ts` (extend existing)
**Estimated tests:** ~12-15 new tests

### Phase 2: lib/db/schema.ts (schema validation — scoped to business-critical defaults)
**Scoped approach:** Only test defaults and constraints with business impact — NOT exhaustive column existence checks. This avoids fragile tests that break on every schema change.

Test targets:
- Business-critical defaults: `fees: 0`, `commissions: 0`, `contractMultiplier: 100`, `fomoFlag: false`, `revengeFlag: false`, `isCustom: false`
- Not-null constraints on financial fields: `entryPrice`, `positionSize`, `ticker`
- Relation definitions exist and reference correct tables (foreign keys: exitLegs→trades, tradeTags→tags, screenshots→trades)
- Settings defaults: `currency: 'USD'`, `defaultRiskPercent: 1`, `defaultCommission: 0`

Skip: exhaustive column-type checks, column name verification, non-financial columns.

**Test file:** `tests/lib/schema.test.ts` (new)
**Estimated tests:** ~8-12 tests (reduced from 15-20)

### Phase 3: trades/services/actions.ts (lines 139, 263-321) — BUSINESS-CRITICAL
**Risk note:** These are the most P&L-sensitive tests in the plan. Incorrect exit leg handling directly affects profit/loss calculations.

Add tests for uncovered paths:
- `updateTrade()` — success path (verify updated fields persist), validation failure, db error catch path (line 139: `syncTradeTags` call)
- `deleteTrade()` — success with screenshot dir cleanup, db error
- `addExitLeg()` — **verify remaining position calculation is correct** (this drives partial-exit P&L)
- `updateExitLeg()` — quantity validation excludes current leg, **verify P&L stays consistent after edit**
- `deleteExitLeg()` — success and error paths

Exit leg edge cases with P&L verification:
- Exact position fill (remaining = 0 after leg)
- Quantity exceeds remaining (reject with correct remaining in error message)
- Multiple legs with different prices (**assert per-leg P&L correctness**)

**Test file:** `tests/features/trades/actions.test.ts` (extend existing)
**Estimated tests:** ~10-12 new tests

### Phase 4: lib/logger.ts (lines 47, 49)
Test `warn()` and `debug()` methods directly by capturing console output.

**Test file:** `tests/lib/logger.test.ts` (new)
**Estimated tests:** ~4-6 tests

### Phase 5: Small gaps — 6 sub-tasks, committed individually

#### 5a: dashboard/queries.ts — error path
- `getDashboardData()` error path: mock `getTrades()` to throw, verify error is re-thrown after logging

**Test file:** `tests/features/dashboard/queries.test.ts` (extend)
**Tests:** ~2

#### 5b: reviews/actions.ts — error path
- `deleteReview()` error path: mock db.delete to throw, verify catch returns `{ success: false }`

**Test file:** `tests/features/reviews/review-actions.test.ts` (extend)
**Tests:** ~1-2

#### 5c: settings/actions.ts — import failure
- CSV import: mock db.insert to throw mid-import, verify error is caught and returns failure

**Test file:** `tests/features/settings/actions.test.ts` (extend)
**Tests:** ~1-2

#### 5d: playbooks/actions.ts — branch gaps
- **Line 27:** `collectFieldErrors` — multiple validation errors on same field appends to existing array (branch: `if (!errors[key])` is false when key already exists)
- **Line 103:** `collectFieldErrors` in `updatePlaybook` — same pattern, multi-error on same field

**Test file:** `tests/features/playbooks/actions.test.ts` (extend)
**Tests:** ~2

#### 5e: journal/actions.ts — branch gap
- **Line 16:** `collectFieldErrors` — same pattern as playbooks: multiple validation errors on same field, second error appends to existing array

**Test file:** `tests/features/journal/journal-actions.test.ts` (extend)
**Tests:** ~1-2

#### 5f: api/export/csv/route.ts — branch gap
- **Line 26:** CSV escape function — value containing a comma, quote, or newline triggers quoting path. Need test with value that has commas/quotes/newlines to hit the truthy branch.

**Test file:** `tests/api/export-csv.test.ts` (new or extend existing)
**Tests:** ~2-3

### Phase 6: Coverage threshold enforcement (final step)
Add coverage thresholds to `vitest.config.ts` to prevent regression:
```ts
coverage: {
  thresholds: {
    statements: 100,
    branches: 100,
    functions: 100,
    lines: 100,
  }
}
```

## Files to Create / Modify

| Action | File Path | Description |
|--------|-----------|-------------|
| Modify | `tests/features/screenshots/storage.test.ts` | Add file I/O function tests |
| Create | `tests/lib/schema.test.ts` | Business-critical defaults & constraint tests |
| Modify | `tests/features/trades/actions.test.ts` | Add updateTrade, exit leg CRUD with P&L verification |
| Create | `tests/lib/logger.test.ts` | Direct logger method tests |
| Modify | `tests/features/dashboard/queries.test.ts` | Add getDashboardData error path |
| Modify | `tests/features/reviews/review-actions.test.ts` | Add deleteReview error path |
| Modify | `tests/features/settings/actions.test.ts` | Add CSV import failure path |
| Modify | `tests/features/playbooks/actions.test.ts` | Multi-error same-field branch |
| Modify | `tests/features/journal/journal-actions.test.ts` | Multi-error same-field branch |
| Create/Modify | `tests/api/export-csv.test.ts` | CSV escape with commas/quotes/newlines |
| Modify | `vitest.config.ts` | Add 100% coverage thresholds |

## Execution Order

1. Phase 1 (storage) — highest impact
2. Phase 2 (schema) — business-critical defaults only
3. Phase 3 (trades) — P&L-critical exit leg logic
4. Phase 4 (logger) — quick win
5. Phase 5a-5f (small gaps) — one commit per sub-task
6. Phase 6 (threshold) — lock in 100% to prevent regression

Run `npx vitest run --coverage` after each phase to track progress.

## Open Questions

- [x] Should `schema.ts` coverage count toward the target? **YES — include it.**
- [x] For `storage.ts`, should we also add integration tests that hit the real filesystem (in a temp dir), or are mocked unit tests sufficient? **Mock only, with cleanup after each test.**

## Decisions Made

- Use `vi.mock('node:fs/promises')` for filesystem tests — mock only, no real I/O
- All mock tests must clean up after themselves (`afterEach` / `afterAll` with `vi.restoreAllMocks()`)
- Schema.ts IS included in coverage target — but scoped to business-critical defaults/constraints only
- Use Drizzle `getTableColumns()` for schema introspection rather than raw SQL
- Extend existing test files where possible rather than creating new ones
- Phase 3 exit leg tests MUST verify P&L computation correctness, not just non-throwing
- Phase 5 sub-tasks committed individually for clean git history
- Phase 6 adds vitest coverage thresholds at 100% to prevent regression

## Comments / Review Notes

- Feedback applied 2026-03-15: scoped schema tests, added P&L risk note to Phase 3, added Phase 6 for threshold enforcement, split Phase 5 into sub-tasks with branch descriptions
