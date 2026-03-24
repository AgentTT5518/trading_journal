# Feature Requirements: Correlation Analysis

**Phase:** Correlation Analysis
**Status:** Implemented ✅
**Owner:** Claude Code
**Last updated:** 2026-03-24

---

## Overview

The correlation analysis feature computes Pearson correlation coefficients between trade psychology fields and P&L outcomes. It provides a correlation matrix, interactive scatter plots for individual field exploration, boolean field comparisons (FOMO, revenge, etc.), and auto-generated text insights. The feature is integrated into the `/analytics` page alongside the P&L heatmap.

---

## User Stories

### US-1 — View correlation matrix
**As a trader, I want to see a matrix of correlations between my psychological states and P&L outcomes so I can identify which emotions most impact my performance.**

- Numeric psychology fields: preMood (1-5), preConfidence (1-5), anxietyDuring (1-5), executionSatisfaction (1-5)
- P&L metrics: netPnl, pnlPercent, rMultiple
- Pearson r computed for each pair with sample size

**Acceptance criteria:**
- [x] Matrix displays all psychology-field vs P&L-metric pairs
- [x] Pearson correlation coefficient shown per cell (-1 to 1)
- [x] Color-coded: green for positive correlation, red for negative, neutral for near-zero
- [x] Sample size shown per pair
- [x] Only includes trades with non-null values for both fields

### US-2 — Explore scatter plots
**As a trader, I want to click a correlation cell to see a scatter plot of that pair so I can visually inspect the relationship.**

- Each point represents one trade
- X-axis: psychology field value, Y-axis: P&L metric
- Tooltip shows trade details (ticker, date, values)

**Acceptance criteria:**
- [x] Scatter plot rendered with Recharts
- [x] Each point shows ticker on hover
- [x] X and Y axes labeled with field names
- [x] Clickable from correlation matrix

### US-3 — Compare boolean psychology flags
**As a trader, I want to see how boolean flags (FOMO, revenge trading, urge to exit early, urge to add) correlate with my P&L outcomes.**

- Compares average P&L when flag is true vs false
- Shows count for each group

**Acceptance criteria:**
- [x] Boolean fields: fomoFlag, revengeFlag, urgeToExitEarly, urgeToAdd
- [x] Average P&L shown for true vs false groups
- [x] Count shown for each group
- [x] P&L difference highlighted (true avg - false avg)

### US-4 — View auto-generated insights
**As a trader, I want text insights summarizing the strongest correlations so I can quickly understand key patterns.**

- Insights generated from correlation data
- Categorized by strength: strong, moderate, weak

**Acceptance criteria:**
- [x] Text insights auto-generated from correlation pairs
- [x] Strength classification (strong/moderate/weak) based on |r| thresholds
- [x] Insights cover both numeric and boolean fields
- [x] Minimum sample size required before generating insights

### US-5 — Integration with analytics page
**As a trader, I want to see correlation analysis on the existing analytics page alongside the P&L heatmap.**

**Acceptance criteria:**
- [x] Correlation dashboard rendered below heatmap on `/analytics`
- [x] No new routes needed — embedded in existing page

---

## Data Model

No schema changes — all data computed from existing `trades` table psychology and P&L fields.

### Computed types

| Type | Description |
|------|-------------|
| `CorrelationPair` | xField, xLabel, yField, yLabel, Pearson r, sample size, data points |
| `ScatterPoint` | x, y, tradeId, ticker, date — one trade in a scatter plot |
| `BooleanCorrelation` | field, label, true avg P&L, false avg P&L, true count, false count, P&L difference |
| `CorrelationInsight` | text description, strength (strong/moderate/weak) |
| `CorrelationData` | pairs[], booleanCorrelations[], insights[] — full payload |

### Psychology fields analyzed

| Field | Type | Range |
|-------|------|-------|
| `preMood` | numeric | 1-5 |
| `preConfidence` | numeric | 1-5 |
| `anxietyDuring` | numeric | 1-5 |
| `executionSatisfaction` | numeric | 1-5 |
| `fomoFlag` | boolean | true/false |
| `revengeFlag` | boolean | true/false |
| `urgeToExitEarly` | boolean | true/false |
| `urgeToAdd` | boolean | true/false |

### P&L metrics

| Metric | Description |
|--------|-------------|
| `netPnl` | Absolute P&L in currency |
| `pnlPercent` | P&L as percentage of position |
| `rMultiple` | P&L expressed as R-multiple (requires planned stop loss) |

---

## Components

| Component | Type | Location | Responsibility |
|-----------|------|----------|----------------|
| `CorrelationDashboard` | Client | `src/features/correlation-analysis/components/correlation-dashboard.tsx` | Top-level wrapper for all correlation widgets |
| `CorrelationMatrix` | Client | `src/features/correlation-analysis/components/correlation-matrix.tsx` | Color-coded matrix of Pearson r values |
| `CorrelationScatter` | Client | `src/features/correlation-analysis/components/correlation-scatter.tsx` | Recharts scatter plot for selected pair |
| `CorrelationInsights` | Client | `src/features/correlation-analysis/components/correlation-insights.tsx` | Auto-generated text insights with strength badges |

## Services

| Function | Location | Description |
|----------|----------|-------------|
| `getCorrelationData` | `src/features/correlation-analysis/services/queries.ts` | Fetches trades, computes all correlation pairs, boolean comparisons, and insights |

---

## Implementation Notes

- Pearson correlation: `r = cov(X,Y) / (stdDev(X) * stdDev(Y))`
- Minimum sample size threshold before computing correlations (avoids misleading results from 2-3 trades)
- Insight strength thresholds: |r| >= 0.7 strong, |r| >= 0.4 moderate, |r| >= 0.2 weak
- No data stored — all computations are pure functions run at query time

---

## Test Coverage

| Test file | Tests | Covers |
|-----------|-------|--------|
| `tests/features/correlation-analysis/queries.test.ts` | — | Pearson r computation, boolean comparisons, insight generation, edge cases (empty data, single trade, null fields) |
