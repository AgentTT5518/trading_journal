# ADR-001: Tech Stack Selection

**Date:** 2026-03-12
**Status:** Accepted
**Deciders:** Project owner

## Context

Choosing the foundational tech stack for a local-first solo trading journal. Key constraints: runs on localhost only, no auth needed, single user, must be fast and simple to develop and maintain.

## Decision

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (Base UI) |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Testing | Vitest |
| Charts | Recharts |
| IDs | nanoid(12) |

## Rationale

- **Next.js 15 App Router**: Server Components reduce client bundle, Server Actions eliminate need for API routes for mutations, built-in file-based routing.
- **SQLite**: Zero config, no server process, WAL mode for concurrent reads. Perfect for single-user localhost app. File-based storage means easy backup (copy one file).
- **Drizzle ORM**: Type-safe queries, lightweight, good SQLite support, schema-driven migrations.
- **shadcn/ui (Base UI)**: Copy-paste components, no runtime dependency, customizable with Tailwind. Uses Base UI (not Radix) — requires `render` prop pattern instead of `asChild`.
- **Vitest**: Fast, native TypeScript support, compatible with Next.js ecosystem.

## Alternatives Considered

- **Prisma** over Drizzle: Heavier runtime, slower cold starts, less SQLite-native.
- **tRPC** over Server Actions: More boilerplate for a solo-user app with no API consumers.
- **PostgreSQL** over SQLite: Overkill for single-user localhost; requires running a server process.
- **Radix UI**: shadcn/ui switched to Base UI — kept aligned with upstream.

## Consequences

- All mutations use Server Actions (no API routes except file downloads)
- Base UI `render` prop pattern must be used (not `asChild`)
- SQLite file lives in `data/` directory (gitignored)
- No ORM migrations — schema pushed directly via `db:push`
