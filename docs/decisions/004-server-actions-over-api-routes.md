# ADR-004: Server Actions for Mutations, No API Routes

**Date:** 2026-03-12
**Status:** Accepted
**Deciders:** Project owner

## Context

Next.js 15 App Router supports both API routes and Server Actions for handling mutations. Need to decide which pattern to use for a solo-user localhost app.

## Decision

All mutations use Server Actions invoked via `useActionState` + form actions. API routes are only used for file downloads (CSV/JSON export, screenshot serving) where `Content-Disposition` headers are needed.

## Rationale

- **Less boilerplate**: No route files, no fetch calls, no request/response parsing. Server Actions are called like functions.
- **Type safety**: Server Action parameters and return types flow through TypeScript without manual serialization.
- **Progressive enhancement**: Forms work without JavaScript (though not a primary concern for localhost).
- **Revalidation**: `revalidatePath()` integrates directly with Next.js caching.
- **No API consumers**: This is a solo-user app with no external API clients. API routes would add unnecessary indirection.

## Exceptions

- `GET /api/export/csv` and `GET /api/export/json` — need Content-Disposition headers for file downloads
- `POST /api/screenshots/[tradeId]` and `GET /api/screenshots/[tradeId]/[filename]` — binary file upload/serve needs streaming

## Consequences

- No REST API surface for external tools (acceptable for localhost-only)
- All form validation happens server-side via Zod schemas
- Error handling returns `ActionState { success: boolean, message: string, errors?: Record }` instead of HTTP status codes
