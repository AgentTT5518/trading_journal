# ADR-006: Filesystem Storage for Screenshots

**Date:** 2026-03-13
**Status:** Accepted
**Deciders:** Project owner

## Context

Trade screenshots need to be stored somewhere. Options: SQLite blob columns, filesystem, or external storage (S3, etc.).

## Decision

Screenshots are stored on the filesystem in `data/screenshots/[tradeId]/[filename]`. A `screenshots` table in SQLite stores metadata (id, tradeId, filename, mimeType, size, createdAt).

## Rationale

- **Performance**: SQLite blob columns degrade read performance for large files and bloat the database file.
- **Simplicity**: Filesystem storage is the simplest approach for a localhost app. No external services needed.
- **Backup friendly**: Screenshots directory can be backed up independently of the database.
- **Direct serving**: API route reads file from disk and streams it — no base64 encoding/decoding.

## Security

- `path.basename()` applied to all filenames to prevent path traversal attacks
- MIME type validation (JPEG, PNG, GIF, WebP only)
- 10MB max file size

## Consequences

- `data/screenshots/` directory is gitignored
- Trade deletion cascades to screenshot file cleanup via service layer
- Backup must include both SQLite file and screenshots directory
