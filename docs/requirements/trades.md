# Feature Requirements: Trades

**Phase:** 1 (Core)
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-13

---

## Overview

The trades feature is the core of the Trading Journal. It lets a solo swing trader log, view, update, and delete trades across stocks, options, and crypto. All P&L is computed at query time — never stored. Trade status (open/closed) is derived from the presence of an exit date.

---

## User Stories

### US-1 — Log a new trade
**As a trader, I want to log a new trade so that I have a record of my entry.**

- I must provide: ticker, direction (long/short), entry date, entry price, position size
- I may optionally provide: asset class, order type, entry trigger/reason, exit data, commissions, fees, notes
- Ticker is automatically upcased
- If I omit exit fields, the trade is saved as **open**
- On success, I am taken to the trade detail page

**Acceptance criteria:**
- [ ] Form validates required fields with inline error messages
- [ ] Empty optional fields are saved as null (not empty string)
- [ ] Success redirects to `/trades/[id]` with a toast
- [ ] Validation failure stays on the form, errors shown per field

---

### US-2 — View all trades
**As a trader, I want to see all my trades in a list so that I can review my history.**

- Trades are listed newest-first (by entry date)
- Each row shows: ticker, direction badge, entry date, entry price, exit price, net P&L badge, status badge
- Clicking a ticker navigates to the trade detail page
- If there are no trades, an empty state with a CTA is shown

**Acceptance criteria:**
- [ ] List is sorted by entry date descending
- [ ] Open trades show "—" for exit price and P&L
- [ ] P&L badge is green for profit, red for loss
- [ ] Empty state renders when the DB has no trades

---

### US-3 — View trade detail
**As a trader, I want to see all details of a single trade including computed P&L.**

The detail page shows four cards:
1. **Trade Info** — ticker, direction, asset class, order type, entry trigger, open/closed badge
2. **P&L Summary** — gross P&L, net P&L, P&L %, R-multiple (if stop defined), holding days
3. **Entry** — date, price, size, notional value
4. **Exit** — date, price, exit reason, commissions, fees

Plus a **Notes** card if notes are present, and an actions row with Edit and Delete buttons.

**Acceptance criteria:**
- [ ] Navigating to `/trades/[id]` for a non-existent trade shows Next.js 404
- [ ] All P&L fields show "—" for open trades
- [ ] Notional value = entry price × position size

---

### US-4 — Edit a trade / close an open position
**As a trader, I want to edit any trade field, and specifically to add exit data to close an open position.**

- The edit form (`/trades/[id]/edit`) pre-populates all fields with existing values
- The exit section is labelled "leave blank to keep open"
- Saving a trade with exit date + price transitions it from open → closed
- On success, I am redirected to the trade detail page with a "Trade updated successfully" toast

**Acceptance criteria:**
- [ ] All fields from the create form are editable
- [ ] datetime-local inputs are pre-populated correctly
- [ ] Removing exit date reopens a closed trade
- [ ] Validation errors shown per field, same as create form
- [ ] Cancel button returns to the detail page without saving

---

### US-5 — Delete a trade
**As a trader, I want to delete a trade that I logged by mistake.**

- A "Delete Trade" button on the detail page opens a confirmation dialog
- The dialog names the ticker and direction so I know what I'm deleting
- Confirming deletes the trade and redirects to `/trades` with a "Trade deleted" toast
- Cancelling closes the dialog with no action

**Acceptance criteria:**
- [ ] No trade is deleted without confirmation
- [ ] After deletion, the trade no longer appears in the list
- [ ] Attempting to navigate directly to a deleted trade's URL shows 404

---

## Data Model

### `trades` table (relevant Phase 1 columns)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | text | PK | nanoid(12) |
| `assetClass` | text | NOT NULL | `stock` \| `option` \| `crypto` |
| `ticker` | text | NOT NULL | Stored upcased |
| `direction` | text | NOT NULL | `long` \| `short` |
| `entryDate` | text | NOT NULL | datetime-local string |
| `entryPrice` | real | NOT NULL | Positive number |
| `positionSize` | real | NOT NULL | Positive number |
| `orderType` | text | nullable | `market` \| `limit` \| `stop_limit` |
| `entryTrigger` | text | nullable | Free text |
| `exitDate` | text | nullable | Presence = closed |
| `exitPrice` | real | nullable | |
| `exitReason` | text | nullable | Enum (6 values) |
| `commissions` | real | NOT NULL | Default 0 |
| `fees` | real | NOT NULL | Default 0 |
| `notes` | text | nullable | Free text |
| `createdAt` | text | NOT NULL | ISO 8601 |
| `updatedAt` | text | NOT NULL | ISO 8601 |

### Computed fields (never stored)

| Field | Formula |
|-------|---------|
| `status` | `'open'` if `exitDate` is null, else `'closed'` |
| `grossPnl` | `(exitPrice - entryPrice) × positionSize × direction_multiplier` |
| `netPnl` | `grossPnl - commissions - fees` |
| `pnlPercent` | `netPnl / (entryPrice × positionSize) × 100` |
| `rMultiple` | `netPnl / (|entryPrice - plannedStopLoss| × positionSize)` |
| `holdingDays` | `ceil((exitDate - entryDate) / 86400000)` |

---

## Routes

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/trades` | `app/(app)/trades/page.tsx` | Trade list |
| GET | `/trades/new` | `app/(app)/trades/new/page.tsx` | Create form |
| POST | Server Action | `createTrade` | Insert trade |
| GET | `/trades/[id]` | `app/(app)/trades/[id]/page.tsx` | Trade detail |
| GET | `/trades/[id]/edit` | `app/(app)/trades/[id]/edit/page.tsx` | Edit form |
| POST | Server Action | `updateTrade(id, ...)` | Update trade |
| POST | Server Action | `deleteTrade(id)` | Delete trade |

---

## Validation Rules

All enforced by `tradeInsertSchema` (Zod v4):

| Field | Rule |
|-------|------|
| `assetClass` | Required, must be `stock \| option \| crypto` |
| `ticker` | Required, 1–20 chars, auto-upcased |
| `direction` | Required, must be `long \| short` |
| `entryDate` | Required, non-empty string |
| `entryPrice` | Required, positive number |
| `positionSize` | Required, positive number |
| `orderType` | Optional, must be valid enum if provided |
| `exitReason` | Optional, must be valid enum if provided |
| `commissions` | Non-negative, defaults to 0 |
| `fees` | Non-negative, defaults to 0 |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `TradeList` | Client | `features/trades/components/` | Table of trades with computed P&L |
| `TradeForm` | Client | `features/trades/components/` | Create form using `useActionState` |
| `TradeEditForm` | Client | `features/trades/components/` | Edit form pre-populated from DB |
| `TradeDetail` | Client | `features/trades/components/` | Four-card detail layout + delete dialog |

---

## Out of Scope (Phase 1)

- Options-specific fields (strikes, expiry, IV, Greeks)
- Crypto-specific fields (exchange, trading pair, leverage, funding rate)
- Risk parameters (planned stop/target, R-multiple planning)
- Psychology fields (mood, confidence, FOMO/revenge flags)
- Chart screenshot uploads
- Tags / playbook associations
- Bulk import / export
- Multi-leg exit strategies

These are tracked in the research document (`docs/requirements/trading-journal-research.md`) and scheduled for Phase 2+.

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `calculations.test.ts` | 15 | All pure P&L functions, edge cases |
| `validations.test.ts` | 8 | Zod schema happy/sad paths |
| `actions.test.ts` | 16 | createTrade, updateTrade, deleteTrade with mocked DB |
| `queries.test.ts` | 9 | getTrades, getTradeById with mocked DB |
| `formatting.test.ts` | 12 | formatCurrency, formatPercent, formatDate, formatPrice |

**Total: 60 tests**
