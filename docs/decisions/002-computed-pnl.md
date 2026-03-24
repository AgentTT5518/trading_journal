# ADR-002: P&L Computed at Query Time, Never Stored

**Date:** 2026-03-12
**Status:** Accepted
**Deciders:** Project owner

## Context

Trade P&L (gross, net, R-multiple) could be stored as columns on the trades table or computed on every read. Need to decide which approach for a solo-user journal.

## Decision

P&L is never stored in the database. It is always computed at query time from trade entry/exit data and exit legs.

## Rationale

- **Single source of truth**: Entry price, exit price, fees, and exit legs are the canonical data. Storing computed P&L creates a sync problem — if a user edits an exit price, the stored P&L becomes stale.
- **Exit legs complicate storage**: When exit legs exist, they are authoritative for P&L. Partial exits change P&L incrementally. Recomputing is simpler than maintaining triggers.
- **Scale is tiny**: A solo trader has hundreds to low thousands of trades. Computing P&L on read is negligible (~1ms for 1000 trades).
- **Testability**: Pure computation functions (`grossPnl`, `netPnl`, `rMultiple`) are easy to unit test without database state.

## Implementation

- `enrichTradeWithCalculations(trade, exitLegs)` is the single entry point
- `deriveStatus(trade, legs)` determines open/partial/closed from exit leg quantities
- `calculateExitLegsPnl(legs, trade)` aggregates per-leg P&L when legs exist
- `getPositionMultiplier(trade)` returns 1 (stock/crypto) or `contractMultiplier` (option)

## Consequences

- No P&L columns in the trades table
- No trade status column — derived from exitDate/legs presence
- All list views and dashboard metrics must compute P&L inline
- If scale ever exceeds ~10K trades, consider materialized views or caching
