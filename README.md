# Trading Journal

A local-first swing trading journal for stocks, options, and crypto. Designed for solo traders who want structured trade logging, real-time P&L tracking, and performance analytics — all on localhost with no cloud dependency.

## Features (Phase 1)

- **Trade Logging** — Create, edit, and delete trades with entry/exit data
- **P&L Computed at Query Time** — Gross P&L, net P&L, P&L %, holding days (never stored in DB)
- **Open / Closed Status** — Derived from exit date presence; update a trade to close it
- **Trade Detail View** — Full breakdown with P&L summary and entry/exit cards
- **Asset Classes** — Stocks (Phase 1), Options & Crypto (Phase 2)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (Base UI) |
| Database | SQLite via Drizzle ORM + better-sqlite3 |
| Validation | Zod v4 |
| Testing | Vitest |
| Package Manager | npm |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Push schema to database (creates data/trading-journal.db)
npm run db:push

# Start dev server on port 5180
npm run dev
```

Open [http://localhost:5180](http://localhost:5180) to use the app.

## Commands

```bash
npm run dev          # Start dev server (port 5180)
npm run build        # Production build
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
npm run test         # Run all tests (Vitest)
npm run db:push      # Sync schema to SQLite (development)
npm run db:studio    # Open Drizzle Studio (DB browser)
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    (app)/                # Shared sidebar layout
      trades/             # Trade CRUD routes
  components/ui/          # shadcn/ui primitives
  features/
    trades/               # Trade logging feature module
      components/         # TradeForm, TradeEditForm, TradeList, TradeDetail
      services/           # actions.ts, queries.ts, calculations.ts
      types.ts / validations.ts / logger.ts
  shared/
    components/           # Sidebar, PageHeader, EmptyState, PnlBadge, LinkButton
    utils/                # formatCurrency, formatPercent, formatDate
  lib/
    db/                   # Drizzle client + schema
    logger.ts / ids.ts / errors.ts / config.ts
data/                     # SQLite database (gitignored)
tests/                    # Mirrors src/ structure
docs/                     # Requirements, decisions, templates
```

## Key Design Decisions

- **P&L is never stored** — always computed at query time from entry/exit prices and position size
- **Trade status is derived** — `open` when `exitDate` is null, `closed` otherwise (no status column)
- **Server Actions only** — No API routes in Phase 1; all mutations use Next.js Server Actions
- **UTC storage, local display** — Dates stored as ISO 8601 strings, displayed in local timezone
- **nanoid(12) IDs** — Short, URL-safe text primary keys
- **Base UI (not Radix)** — shadcn/ui uses Base UI components; use `render` prop instead of `asChild`

## Development Notes

### Database

The SQLite database lives at `data/trading-journal.db` (gitignored). Run `npm run db:push` after any schema changes in development. Switch to `drizzle-kit generate` + `migrate` before shipping to production.

### Adding a Feature

Follow the feature workflow in `CLAUDE.md`:
1. Copy `docs/templates/FEATURE-CLAUDE.md` to `src/features/[name]/CLAUDE.md`
2. Write requirements in `docs/requirements/[feature].md`
3. Create a scoped logger: `src/features/[name]/logger.ts`
4. Implement in `src/features/[name]/` — ask before touching shared code
5. Write tests in `tests/features/[name]/`
6. Update `ARCHITECTURE.md`

### Running Tests

```bash
npm run test                    # Run all tests once
npm run test:watch              # Watch mode
npm run typecheck && npm run lint && npm run test  # Full pre-commit check
```

## Roadmap

| Phase | Scope |
|-------|-------|
| **1 — Core** ✅ | Trade CRUD, computed P&L, open/closed status |
| **2 — Risk** | Stop loss, R-multiple planning, options & crypto support |
| **3 — Analytics** | Dashboard, equity curve, win rate, sector breakdowns |
| **4 — Psychology** | Pre-trade mood/confidence, FOMO/revenge flags, execution grades |
| **5 — Context** | Market regime, technical indicators at entry, catalyst tracking |
| **6 — Screenshots** | Chart image uploads attached to trades |
