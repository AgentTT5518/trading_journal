# Plan: Enhancements V2

**Status:** In Progress
**Created:** 2026-03-16
**Feature Branch:** `feature/enhancements_v2`

---

## Goal / Problem Statement
Implement high-impact enhancements identified during codebase review:
1. Dashboard date range filter (traders need period-specific views)
2. Trade list search & filtering (no way to find specific trades)
3. Profit factor + max drawdown + avg win/loss metrics (key missing analytics)
4. Currency setting wired to formatCurrency/formatPrice (hardcoded USD)
5. Root redirect changed to /dashboard (more natural landing page)
6. Missing loading/error states on playbooks, reviews, tags routes
7. Sidebar icons via lucide-react (improve navigation scannability)

## Proposed Approach
- Work from lowest-risk to highest-risk changes
- Shared utility changes first (currency), then UI (sidebar, loading states), then features (dashboard filters, trade search, metrics)
- All changes tested before commit

## Files to Create / Modify
| Action | File Path | Description |
|--------|-----------|-------------|
| Modify | `src/shared/utils/formatting.ts` | Accept currency param in formatCurrency/formatPrice |
| Modify | `src/shared/components/sidebar.tsx` | Add lucide-react icons |
| Modify | `src/app/page.tsx` | Redirect to /dashboard instead of /trades |
| Create | `src/app/(app)/playbooks/loading.tsx` | Skeleton loader |
| Create | `src/app/(app)/playbooks/error.tsx` | Error boundary |
| Create | `src/app/(app)/reviews/loading.tsx` | Skeleton loader |
| Create | `src/app/(app)/reviews/error.tsx` | Error boundary |
| Create | `src/app/(app)/tags/loading.tsx` | Skeleton loader |
| Create | `src/app/(app)/tags/error.tsx` | Error boundary |
| Modify | `src/features/dashboard/types.ts` | Add new metric types |
| Modify | `src/features/dashboard/services/queries.ts` | Add profit factor, drawdown, avg win/loss |
| Modify | `src/features/dashboard/components/stat-card.tsx` | Support subtitle/secondary value |
| Create | `src/features/dashboard/components/date-range-filter.tsx` | Date range picker component |
| Modify | `src/app/(app)/dashboard/page.tsx` | Wire date filter + new metrics |
| Create | `src/features/trades/components/trade-filters.tsx` | Search + filter bar |
| Modify | `src/features/trades/components/trade-list.tsx` | Accept and apply filters |
| Modify | `src/app/(app)/trades/page.tsx` | Wire filter state |
| Modify | `package.json` | Add lucide-react |
| Modify | `tests/` | Update affected tests |

## Decisions Made
- Use lucide-react for icons (standard Next.js ecosystem choice, tree-shakeable)
- Date range filter uses preset buttons (7d/30d/90d/YTD/All) rather than a date picker to avoid adding a heavy dependency
- Trade list filtering is client-side (sufficient for solo trader volume)
- Currency parameter defaults to 'USD' for backward compatibility

## Comments / Review Notes
- All enhancements are additive — no breaking changes to existing functionality
