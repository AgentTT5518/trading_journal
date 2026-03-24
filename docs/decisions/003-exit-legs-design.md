# ADR-003: Exit Legs as Separate Table

**Date:** 2026-03-13
**Status:** Accepted
**Deciders:** Project owner

## Context

Swing traders often scale out of positions in multiple partial exits. Need to model this cleanly while maintaining backward compatibility with single-exit trades.

## Decision

Exit legs are stored in a separate `exit_legs` table with a foreign key to `trades`. When exit legs exist, they are authoritative for P&L and status — the top-level `exitPrice`/`exitDate` columns on the trade are ignored.

## Rationale

- **Flexibility**: Supports any number of partial exits with different prices, dates, quantities, and reasons.
- **Backward compatibility**: Simple trades with one exit still work — just set `exitPrice`/`exitDate` on the trade directly (no legs needed).
- **Clear precedence rule**: "When legs exist, legs win" is simple to understand and implement.
- **Cascade delete**: Deleting a trade cascades to its exit legs automatically.

## Status Derivation

```
No exitDate + no legs       → "open"
Legs exist, sum < position  → "partial"
Legs exist, sum >= position → "closed"
exitDate set (no legs)      → "closed"
```

## Consequences

- Every P&L computation must check for exit legs first
- Trade list and detail views must join exit legs
- Quantity validation on leg add/edit ensures sum doesn't exceed position size
