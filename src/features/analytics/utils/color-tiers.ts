/**
 * Maps a daily P&L value to a Tailwind background color class.
 *
 * Uses 4 discrete tiers per direction based on the ratio of pnl to maxProfit/maxLoss.
 * v1 decision: discrete tiers over continuous gradient for simplicity.
 */

type ColorTier = {
  bg: string;
  text: string;
};

const GREEN_TIERS: ColorTier[] = [
  { bg: 'bg-green-200', text: 'text-green-800' },
  { bg: 'bg-green-400', text: 'text-green-900' },
  { bg: 'bg-green-600', text: 'text-white' },
  { bg: 'bg-green-800', text: 'text-white' },
];

const RED_TIERS: ColorTier[] = [
  { bg: 'bg-red-200', text: 'text-red-800' },
  { bg: 'bg-red-400', text: 'text-red-900' },
  { bg: 'bg-red-600', text: 'text-white' },
  { bg: 'bg-red-800', text: 'text-white' },
];

const NEUTRAL: ColorTier = { bg: 'bg-muted', text: 'text-muted-foreground' };
const BREAKEVEN: ColorTier = { bg: 'bg-gray-300', text: 'text-gray-700' };

function getTierIndex(ratio: number): number {
  // ratio is 0..1 (clamped). Map to tier 0-3.
  if (ratio <= 0.25) return 0;
  if (ratio <= 0.5) return 1;
  if (ratio <= 0.75) return 2;
  return 3;
}

export function getPnlColorTier(
  pnl: number | null,
  maxProfit: number,
  maxLoss: number,
): ColorTier {
  if (pnl == null) return NEUTRAL;
  if (pnl === 0) return BREAKEVEN;

  if (pnl > 0) {
    if (maxProfit <= 0) return GREEN_TIERS[0];
    const ratio = Math.min(pnl / maxProfit, 1);
    return GREEN_TIERS[getTierIndex(ratio)];
  }

  // pnl < 0
  if (maxLoss <= 0) return RED_TIERS[0];
  const ratio = Math.min(Math.abs(pnl) / maxLoss, 1);
  return RED_TIERS[getTierIndex(ratio)];
}

export function getPnlColorClass(
  pnl: number | null,
  maxProfit: number,
  maxLoss: number,
): string {
  const tier = getPnlColorTier(pnl, maxProfit, maxLoss);
  return `${tier.bg} ${tier.text}`;
}
