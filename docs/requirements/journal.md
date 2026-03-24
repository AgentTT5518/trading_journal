# Feature Requirements: Journal

**Phase:** Journal
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-24

---

## Overview

The journal feature provides a free-form trading diary at `/journal`. Traders can write pre-market prep, post-market reflections, intraday observations, general notes, and lessons learned. Each entry captures optional mood (1-5), energy (1-5), and market sentiment. Entries can be linked to specific trades via a junction table. Multiple entries per day are supported.

---

## User Stories

### US-1 — Create a journal entry
**As a trader, I want to write free-form diary entries so I can capture thoughts, observations, and lessons throughout the trading day.**

- Entry requires a date and content body
- Category must be one of: pre_market, post_market, intraday, general, lesson
- Optional fields: title, mood (1-5), energy (1-5), market sentiment (bullish/bearish/neutral/uncertain)
- Optional trade linking via multi-select

**Acceptance criteria:**
- [x] Form validates date and content as required
- [x] Category selector with 5 options
- [x] Mood and energy inputs accept integer 1-5 or null
- [x] Market sentiment dropdown with 4 options or null
- [x] Trade multi-select allows linking 0+ trades
- [x] Multiple entries per day supported
- [x] Server action creates entry + journal_trades junction rows in one transaction

### US-2 — View journal entry list
**As a trader, I want to browse my journal entries in reverse chronological order so I can review past reflections.**

- List page at `/journal` shows entries sorted by date descending
- Each row shows date, category badge, title or content preview, mood, and linked trade count

**Acceptance criteria:**
- [x] Entries sorted newest-first
- [x] Category shown as a styled badge
- [x] Trade count displayed per entry
- [x] Empty state shown when no entries exist

### US-3 — View journal entry detail
**As a trader, I want to view a single journal entry with all its fields and linked trades.**

- Detail page at `/journal/[id]` shows full content, metadata, and linked trades with ticker/direction/date

**Acceptance criteria:**
- [x] All fields displayed (date, category, title, content, mood, energy, market sentiment)
- [x] Linked trades shown with ticker, direction, and entry date
- [x] Edit and delete actions available

### US-4 — Edit a journal entry
**As a trader, I want to edit an existing journal entry to correct or expand my notes.**

- Edit page at `/journal/[id]/edit` pre-fills the form with existing data
- Trade links can be added or removed

**Acceptance criteria:**
- [x] Form pre-populated with existing values
- [x] Trade links updated on save (junction rows synced)
- [x] Redirects to detail page after save

### US-5 — Delete a journal entry
**As a trader, I want to delete a journal entry I no longer need.**

**Acceptance criteria:**
- [x] Confirmation required before deletion
- [x] Junction rows cascade-deleted automatically
- [x] Redirects to journal list after deletion

### US-6 — Loading and error states
**As a trader, I want skeleton loaders and error boundaries so the journal pages feel responsive.**

**Acceptance criteria:**
- [x] `/journal/loading.tsx` renders skeleton
- [x] `/journal/error.tsx` renders error boundary with retry button

---

## Data Model

### `journal_entries` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `date` | text | NOT NULL, YYYY-MM-DD |
| `category` | text | NOT NULL, enum: pre_market, post_market, intraday, general, lesson |
| `title` | text | nullable |
| `content` | text | NOT NULL |
| `mood` | integer | nullable, 1-5 |
| `energy` | integer | nullable, 1-5 |
| `market_sentiment` | text | nullable, enum: bullish, bearish, neutral, uncertain |
| `created_at` | text | NOT NULL, ISO 8601 |
| `updated_at` | text | NOT NULL, ISO 8601 |

### `journal_trades` junction table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `journal_entry_id` | text | NOT NULL, FK -> journal_entries.id (cascade) |
| `trade_id` | text | NOT NULL, FK -> trades.id (cascade) |

Unique constraint on `(journal_entry_id, trade_id)`.

---

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/journal` | Server | Journal entry list page |
| `/journal/new` | Server | Create new journal entry |
| `/journal/[id]` | Server | Journal entry detail |
| `/journal/[id]/edit` | Server | Edit journal entry |
| `/journal/loading.tsx` | Server | Skeleton loading state |
| `/journal/error.tsx` | Client | Error boundary with retry |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `JournalList` | Client | `src/features/journal/components/journal-list.tsx` | Paginated list of entries with category badges and trade counts |
| `JournalForm` | Client | `src/features/journal/components/journal-form.tsx` | Create form with category, mood, energy, sentiment, trade linking |
| `JournalEditForm` | Client | `src/features/journal/components/journal-edit-form.tsx` | Edit form pre-filled with existing entry data |
| `JournalDetail` | Client | `src/features/journal/components/journal-detail.tsx` | Full entry view with linked trades |

## Services

| Function | Location | Description |
|----------|----------|-------------|
| `getJournalEntries` | `src/features/journal/services/queries.ts` | Fetch all entries with trade counts |
| `getJournalEntryById` | `src/features/journal/services/queries.ts` | Fetch single entry with linked trade details |
| `createJournalEntry` | `src/features/journal/services/actions.ts` | Server action — insert entry + junction rows |
| `updateJournalEntry` | `src/features/journal/services/actions.ts` | Server action — update entry + sync junction rows |
| `deleteJournalEntry` | `src/features/journal/services/actions.ts` | Server action — delete entry (junction cascades) |

---

## Validation

Zod schema (`src/features/journal/validations.ts`):
- `date`: required string
- `category`: enum (5 values)
- `title`: optional nullable string
- `content`: required string (min 1)
- `mood`: optional nullable integer 1-5
- `energy`: optional nullable integer 1-5
- `marketSentiment`: optional nullable enum (4 values)
- `tradeIds`: optional array of strings

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/journal/validations.test.ts` | 23 | Schema validation for all fields, edge cases |
| `tests/features/journal/queries.test.ts` | 10 | Query functions, trade linking, empty state |
| `tests/features/journal/journal-actions.test.ts` | 15 | Create, update, delete actions with junction sync |
