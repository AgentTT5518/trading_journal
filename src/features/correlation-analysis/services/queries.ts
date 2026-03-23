import { getTrades } from '@/features/trades/services/queries';
import { log } from '../logger';
import type { TradeWithCalculations } from '@/features/trades/types';
import type {
  PsychologyField,
  BooleanPsychologyField,
  PnlMetric,
  ScatterPoint,
  CorrelationPair,
  BooleanCorrelation,
  CorrelationInsight,
  CorrelationData,
} from '../types';

const PSYCHOLOGY_FIELDS: { field: PsychologyField; label: string }[] = [
  { field: 'preMood', label: 'Pre-Trade Mood' },
  { field: 'preConfidence', label: 'Confidence' },
  { field: 'anxietyDuring', label: 'Anxiety During' },
  { field: 'executionSatisfaction', label: 'Execution Satisfaction' },
];

const BOOLEAN_FIELDS: { field: BooleanPsychologyField; label: string }[] = [
  { field: 'fomoFlag', label: 'FOMO' },
  { field: 'revengeFlag', label: 'Revenge Trade' },
  { field: 'urgeToExitEarly', label: 'Urge to Exit Early' },
  { field: 'urgeToAdd', label: 'Urge to Add' },
];

const PNL_METRICS: { field: PnlMetric; label: string }[] = [
  { field: 'netPnl', label: 'Net P&L ($)' },
  { field: 'pnlPercent', label: 'P&L (%)' },
  { field: 'rMultiple', label: 'R-Multiple' },
];

/** Compute Pearson correlation coefficient */
export function computePearsonCorrelation(xs: number[], ys: number[]): { r: number; n: number } {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { r: 0, n };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return { r: 0, n };
  return { r: numerator / denominator, n };
}

/** Extract numeric scatter data for a psychology field vs P&L metric */
export function getScatterData(
  trades: TradeWithCalculations[],
  xField: PsychologyField,
  yField: PnlMetric
): ScatterPoint[] {
  return trades
    .filter((t) => t.status === 'closed' && t[xField] != null && t[yField] != null)
    .map((t) => ({
      x: t[xField] as number,
      y: t[yField] as number,
      tradeId: t.id,
      ticker: t.ticker,
      date: t.entryDate,
    }));
}

/** Compute all numeric correlations between psychology fields and P&L metrics */
export function computeCorrelationPairs(trades: TradeWithCalculations[]): CorrelationPair[] {
  const closed = trades.filter((t) => t.status === 'closed');
  const pairs: CorrelationPair[] = [];

  for (const psych of PSYCHOLOGY_FIELDS) {
    for (const pnl of PNL_METRICS) {
      const dataPoints = getScatterData(closed, psych.field, pnl.field);
      if (dataPoints.length < 3) continue;

      const xs = dataPoints.map((p) => p.x);
      const ys = dataPoints.map((p) => p.y);
      const { r, n } = computePearsonCorrelation(xs, ys);

      pairs.push({
        xField: psych.field,
        xLabel: psych.label,
        yField: pnl.field,
        yLabel: pnl.label,
        correlation: Math.round(r * 100) / 100,
        sampleSize: n,
        dataPoints,
      });
    }
  }

  return pairs;
}

/** Compute average P&L for boolean psychology flags (true vs false) */
export function computeBooleanCorrelations(
  trades: TradeWithCalculations[]
): BooleanCorrelation[] {
  const closed = trades.filter((t) => t.status === 'closed' && t.netPnl != null);
  const results: BooleanCorrelation[] = [];

  for (const { field, label } of BOOLEAN_FIELDS) {
    const trueTrades = closed.filter((t) => t[field] === true);
    const falseTrades = closed.filter((t) => t[field] === false || t[field] == null);

    if (trueTrades.length === 0 && falseTrades.length === 0) continue;

    const trueAvg = trueTrades.length > 0
      ? trueTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0) / trueTrades.length
      : 0;
    const falseAvg = falseTrades.length > 0
      ? falseTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0) / falseTrades.length
      : 0;

    results.push({
      field,
      label,
      trueAvgPnl: Math.round(trueAvg * 100) / 100,
      falseAvgPnl: Math.round(falseAvg * 100) / 100,
      trueCount: trueTrades.length,
      falseCount: falseTrades.length,
      pnlDifference: Math.round((trueAvg - falseAvg) * 100) / 100,
    });
  }

  return results;
}

/** Generate human-readable insights from correlation data */
export function generateInsights(
  pairs: CorrelationPair[],
  booleanCorrelations: BooleanCorrelation[]
): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];

  // Numeric correlation insights
  for (const pair of pairs) {
    if (pair.sampleSize < 5) continue;
    const absR = Math.abs(pair.correlation);
    if (absR < 0.2) continue;

    const strength: 'strong' | 'moderate' | 'weak' = absR >= 0.5 ? 'strong' : absR >= 0.3 ? 'moderate' : 'weak';
    const direction = pair.correlation > 0 ? 'positively' : 'negatively';

    insights.push({
      text: `${pair.xLabel} is ${strength}ly ${direction} correlated with ${pair.yLabel} (r=${pair.correlation}, n=${pair.sampleSize})`,
      strength,
    });
  }

  // Boolean flag insights
  for (const bc of booleanCorrelations) {
    if (bc.trueCount < 2) continue;
    const diff = bc.pnlDifference;
    if (Math.abs(diff) < 1) continue;

    const strength: 'strong' | 'moderate' | 'weak' =
      Math.abs(diff) > 100 ? 'strong' : Math.abs(diff) > 30 ? 'moderate' : 'weak';
    const direction = diff > 0 ? 'higher' : 'lower';

    insights.push({
      text: `Trades with ${bc.label} have $${Math.abs(diff).toFixed(0)} ${direction} avg P&L (${bc.trueCount} trades vs ${bc.falseCount})`,
      strength,
    });
  }

  // Sort by strength (strong first)
  const order = { strong: 0, moderate: 1, weak: 2 };
  insights.sort((a, b) => order[a.strength] - order[b.strength]);

  return insights;
}

/** Main entry: compute all correlation data */
export async function getCorrelationData(): Promise<CorrelationData> {
  try {
    const trades = await getTrades();
    const pairs = computeCorrelationPairs(trades);
    const booleanCorrelations = computeBooleanCorrelations(trades);
    const insights = generateInsights(pairs, booleanCorrelations);

    return { pairs, booleanCorrelations, insights };
  } catch (error) {
    log.error('Failed to get correlation data', error as Error);
    return { pairs: [], booleanCorrelations: [], insights: [] };
  }
}
