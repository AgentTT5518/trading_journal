# ADR-005: Feature Boundary Pattern with Per-Feature CLAUDE.md

**Date:** 2026-03-13
**Status:** Accepted
**Deciders:** Project owner

## Context

As features grow, changes in one feature can accidentally break others. Need a pattern to enforce boundaries and track cross-feature dependencies during development.

## Decision

Each feature in `src/features/[name]/` has its own `CLAUDE.md` that defines:
- Scope (what files it owns)
- Dependencies (what it reads from other features)
- Progress checklist
- Cross-boundary edit log

Developers (including AI assistants) must request approval before editing files outside their current feature folder.

## Rationale

- **Prevents accidental coupling**: Forces conscious decisions about cross-feature edits.
- **Audit trail**: Cross-boundary edit logs track when and why shared code was modified.
- **Scoped loggers**: Each feature creates its own logger from the factory, making log output traceable.
- **Parallel development safe**: Multiple developers can work on different features without stepping on each other.

## Structure

```
src/features/[name]/
  CLAUDE.md           # Boundary rules + progress
  logger.ts           # Scoped logger: createLogger('[name]')
  types.ts            # Feature-local types
  components/         # Feature UI
  services/           # Queries + actions
```

## Consequences

- Every new feature must start with CLAUDE.md creation (Step 1 of Feature Workflow)
- Cross-boundary edits require the BOUNDARY ALERT format
- Shared code in `src/shared/` is a protected zone requiring approval
