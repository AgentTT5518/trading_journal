# Feature Requirements: Playbooks & Tags

**Phase:** Playbooks & Tags (Phase 7)
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-24

---

## Overview

The playbooks and tags feature provides structured trade categorization and strategy documentation. Tags are grouped by 6 immutable categories (strategy, market_condition, timeframe, instrument, execution, mistake) and can be custom or seeded. Tags link to trades via a junction table. Playbooks define trading strategies with entry/exit rules, position sizing, and market conditions. Playbook metrics (trade count, win rate) are computed at query time. Tags can optionally belong to a playbook.

---

## User Stories

### US-1 — Manage tags
**As a trader, I want to create, edit, and delete tags so I can categorize my trades consistently.**

- Tag manager page at `/tags` with CRUD operations
- Each tag has a name and one of 6 fixed categories
- Tags can be marked as custom or seeded (pre-populated defaults)

**Acceptance criteria:**
- [x] Tag manager shows all tags grouped by category
- [x] Create tag with name and category
- [x] Edit tag name (category is immutable after creation)
- [x] Delete tag (cascade removes trade-tag links)
- [x] Seeded tags provided on first run via `seed-tags.ts`
- [x] Custom tags marked with `is_custom` flag

### US-2 — Apply tags to trades
**As a trader, I want to tag my trades with multiple labels so I can filter and analyze by strategy, condition, or mistake.**

- Collapsible category selector in trade form (create + edit)
- Tags grouped by category for easy browsing

**Acceptance criteria:**
- [x] Tag selector rendered in trade create and edit forms
- [x] Tags displayed grouped by collapsible category sections
- [x] Multiple tags selectable per trade
- [x] Trade-tag junction rows synced on save
- [x] Tag badges shown on trade detail page

### US-3 — View tag usage
**As a trader, I want to see how many trades use each tag so I can identify my most common patterns.**

**Acceptance criteria:**
- [x] Trade count displayed per tag in tag manager
- [x] Tags with zero trades can be deleted

### US-4 — Create a playbook
**As a trader, I want to define playbooks that document my trading strategies so I can track which strategies work best.**

- Playbook CRUD at `/playbooks`
- Fields: name, description, entry rules, exit rules, market conditions, position sizing rules
- Tags can be associated with a playbook

**Acceptance criteria:**
- [x] Create playbook with name, description, and rule fields
- [x] Edit playbook details
- [x] Delete playbook (tags unlinked via set null, not deleted)
- [x] Tags associated with playbook shown on detail page

### US-5 — View playbook metrics
**As a trader, I want to see computed performance metrics for each playbook so I can evaluate strategy effectiveness.**

- Metrics computed at query time from linked tags and their trades

**Acceptance criteria:**
- [x] Trade count computed from trades linked via playbook tags
- [x] Win rate computed from closed trades
- [x] Metrics shown on playbook list and detail pages
- [x] Never stored — always computed fresh

### US-6 — Loading and error states
**As a trader, I want skeleton loaders and error boundaries for tags and playbook pages.**

**Acceptance criteria:**
- [x] `/tags/loading.tsx` and `/tags/error.tsx` present
- [x] `/playbooks/loading.tsx` and `/playbooks/error.tsx` present

---

## Data Model

### `tags` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `name` | text | NOT NULL |
| `category` | text | NOT NULL, enum: strategy, market_condition, timeframe, instrument, execution, mistake |
| `playbook_id` | text | nullable, FK -> playbooks.id (set null on delete) |
| `is_custom` | integer | NOT NULL, boolean, default false |
| `created_at` | text | NOT NULL, ISO 8601 |

### `trade_tags` junction table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `trade_id` | text | NOT NULL, FK -> trades.id (cascade) |
| `tag_id` | text | NOT NULL, FK -> tags.id (cascade) |
| `notes` | text | nullable |
| `created_at` | text | NOT NULL, ISO 8601 |

### `playbooks` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `name` | text | NOT NULL |
| `description` | text | nullable |
| `entry_rules` | text | nullable |
| `exit_rules` | text | nullable |
| `market_conditions` | text | nullable |
| `position_sizing_rules` | text | nullable |
| `created_at` | text | NOT NULL, ISO 8601 |
| `updated_at` | text | NOT NULL, ISO 8601 |

---

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/tags` | Server | Tag manager page |
| `/tags/loading.tsx` | Server | Skeleton loading state |
| `/tags/error.tsx` | Client | Error boundary with retry |
| `/playbooks` | Server | Playbook list page |
| `/playbooks/new` | Server | Create playbook form |
| `/playbooks/[id]` | Server | Playbook detail with metrics and tags |
| `/playbooks/[id]/edit` | Server | Edit playbook form |
| `/playbooks/loading.tsx` | Server | Skeleton loading state |
| `/playbooks/error.tsx` | Client | Error boundary with retry |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `TagManager` | Client | `src/features/playbooks/components/tag-manager.tsx` | Full tag CRUD with category grouping |
| `TagSelector` | Client | `src/features/playbooks/components/tag-selector.tsx` | Collapsible category selector for trade forms |
| `TagBadge` | Server-safe | `src/features/playbooks/components/tag-badge.tsx` | Styled badge for tag display |
| `PlaybookList` | Client | `src/features/playbooks/components/playbook-list.tsx` | List of playbooks with metrics |
| `PlaybookForm` | Client | `src/features/playbooks/components/playbook-form.tsx` | Create playbook form |
| `PlaybookEditForm` | Client | `src/features/playbooks/components/playbook-edit-form.tsx` | Edit playbook form |
| `PlaybookDetail` | Client | `src/features/playbooks/components/playbook-detail.tsx` | Playbook view with associated tags and metrics |

## Services

| Function | Location | Description |
|----------|----------|-------------|
| `getAllTags` | `src/features/playbooks/services/queries.ts` | Fetch all tags with trade counts |
| `getTagsByCategory` | `src/features/playbooks/services/queries.ts` | Fetch tags grouped by category |
| `getPlaybooks` | `src/features/playbooks/services/queries.ts` | Fetch all playbooks with computed metrics |
| `getPlaybookById` | `src/features/playbooks/services/queries.ts` | Fetch single playbook with tags and metrics |
| `createTag` | `src/features/playbooks/services/actions.ts` | Server action — create tag |
| `updateTag` | `src/features/playbooks/services/actions.ts` | Server action — update tag name |
| `deleteTag` | `src/features/playbooks/services/actions.ts` | Server action — delete tag |
| `createPlaybook` | `src/features/playbooks/services/actions.ts` | Server action — create playbook |
| `updatePlaybook` | `src/features/playbooks/services/actions.ts` | Server action — update playbook |
| `deletePlaybook` | `src/features/playbooks/services/actions.ts` | Server action — delete playbook |
| `seedDefaultTags` | `src/features/playbooks/services/seed-tags.ts` | Seed predefined tags on first run |

---

## Tag Categories

| Category | Description | Example tags |
|----------|-------------|--------------|
| `strategy` | Trading strategy used | Breakout, Mean Reversion, Momentum |
| `market_condition` | Market environment | Trending, Range-bound, High Volatility |
| `timeframe` | Holding period | Scalp, Day Trade, Swing, Position |
| `instrument` | Instrument type | Stock, Call Option, Put Option, Crypto |
| `execution` | Execution quality | Clean Entry, Early Exit, Added to Loser |
| `mistake` | Errors made | FOMO Entry, Moved Stop, Over-sized |

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/playbooks/validations.test.ts` | — | Tag and playbook validation schemas |
| `tests/features/playbooks/actions.test.ts` | — | Tag CRUD actions, trade-tag sync |
| `tests/features/playbooks/playbook-actions.test.ts` | — | Playbook CRUD actions |
| `tests/features/playbooks/seed-tags.test.ts` | — | Default tag seeding, idempotency |
