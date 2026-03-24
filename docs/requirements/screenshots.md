# Feature Requirements: Screenshots

**Phase:** Screenshots (Phase 6)
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-24

---

## Overview

The screenshots feature provides filesystem-based image storage for trades. Traders can upload chart screenshots and annotated images via drag-and-drop on the trade detail page. Images are stored in `data/screenshots/[tradeId]/` and served via API routes. A thumbnail gallery with lightbox modal provides browsing. Screenshots are cleaned up when a trade is deleted.

---

## User Stories

### US-1 — Upload screenshots to a trade
**As a trader, I want to drag and drop chart screenshots onto a trade so I can visually document my setups and outcomes.**

- Drag-and-drop zone on trade detail page
- Validates MIME type (JPEG, PNG, GIF, WebP) and file size (max 10 MB)
- Files stored to `data/screenshots/[tradeId]/` with nanoid filenames

**Acceptance criteria:**
- [x] Drag-and-drop upload zone rendered on trade detail
- [x] Accepts JPEG, PNG, GIF, WebP only
- [x] Rejects files over 10 MB with error message
- [x] File saved to filesystem with unique filename
- [x] Screenshot record created in database with original name, MIME type, and size
- [x] Gallery updates immediately after upload

### US-2 — View screenshot gallery
**As a trader, I want to see thumbnails of all screenshots attached to a trade.**

- Thumbnail grid on trade detail page
- Shows original filename and upload date

**Acceptance criteria:**
- [x] Thumbnails displayed in a grid layout
- [x] Images served via GET API route
- [x] Empty state when no screenshots attached

### US-3 — View screenshot in lightbox
**As a trader, I want to click a thumbnail to view the full-size image in a modal.**

**Acceptance criteria:**
- [x] Clicking thumbnail opens lightbox modal
- [x] Full-size image displayed
- [x] Close button and overlay click to dismiss

### US-4 — Delete a screenshot
**As a trader, I want to remove a screenshot I no longer need.**

**Acceptance criteria:**
- [x] Delete button on each screenshot
- [x] File removed from filesystem
- [x] Database record deleted
- [x] Gallery updates after deletion

### US-5 — Cleanup on trade deletion
**As a trader, I want screenshots automatically removed when I delete a trade so there are no orphaned files.**

**Acceptance criteria:**
- [x] Trade delete action removes the `data/screenshots/[tradeId]/` directory
- [x] Database records cascade-deleted via FK constraint

---

## Data Model

### `screenshots` table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | text | PK, nanoid(12) |
| `trade_id` | text | NOT NULL, FK -> trades.id (cascade) |
| `filename` | text | NOT NULL, nanoid-generated filename |
| `original_name` | text | NOT NULL, user's original filename |
| `mime_type` | text | NOT NULL, one of: image/jpeg, image/png, image/gif, image/webp |
| `size` | integer | NOT NULL, file size in bytes |
| `notes` | text | nullable |
| `created_at` | text | NOT NULL, ISO 8601 |

Files stored at: `data/screenshots/[tradeId]/[filename]`

---

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `POST /api/screenshots/[tradeId]` | API | Upload a screenshot file (multipart form data) |
| `GET /api/screenshots/[tradeId]/[filename]` | API | Serve a screenshot file with path traversal defense |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `ScreenshotUpload` | Client | `src/features/screenshots/components/screenshot-upload.tsx` | Drag-and-drop upload zone with validation |
| `ScreenshotGallery` | Client | `src/features/screenshots/components/screenshot-gallery.tsx` | Thumbnail grid with lightbox modal and delete |

## Services

| Function | Location | Description |
|----------|----------|-------------|
| `getScreenshotsByTradeId` | `src/features/screenshots/services/queries.ts` | Fetch all screenshots for a trade |
| `createScreenshot` | `src/features/screenshots/services/actions.ts` | Save file to disk + insert DB record |
| `deleteScreenshot` | `src/features/screenshots/services/actions.ts` | Remove file from disk + delete DB record |
| `saveFile` | `src/features/screenshots/services/storage.ts` | Filesystem write with directory creation |
| `deleteFile` | `src/features/screenshots/services/storage.ts` | Filesystem delete |
| `deleteTradeScreenshotDir` | `src/features/screenshots/services/storage.ts` | Remove entire trade screenshot directory |

---

## Validation

File validation (`src/features/screenshots/validations.ts`):
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Max file size: 10 MB (10,485,760 bytes)
- Path traversal defense on serve route (filename cannot contain `..` or `/`)

---

## Security

- API route for serving files validates `tradeId` and `filename` against path traversal
- Only files within the expected directory are served
- MIME type validated on upload, not trusted from filename extension

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/screenshots/validations.test.ts` | — | MIME type and size validation |
| `tests/features/screenshots/storage.test.ts` | — | Filesystem operations, directory creation, cleanup |
| `tests/features/screenshots/actions.test.ts` | — | Upload and delete actions, DB record management |
