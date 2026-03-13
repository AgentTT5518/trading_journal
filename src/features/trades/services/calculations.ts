import type { Trade, ExitLeg, TradeWithCalculations } from '../types';

// Returns the per-contract multiplier. Options default to 100 (standard equity options).
// Uses contractMultiplier column if set, otherwise 100.
export function getPositionMultiplier(trade: Trade): number {
  if (trade.assetClass === 'option') {
    return trade.contractMultiplier ?? 100;
  }
  return 1;
}

// Returns the effective position quantity for P&L calculations.
// Options use contracts; stocks and crypto use positionSize.
export function getEffectiveSize(trade: Trade): number {
  if (trade.assetClass === 'option') {
    return (trade.contracts ?? trade.positionSize) * getPositionMultiplier(trade);
  }
  return trade.positionSize;
}

// Computes days to expiry from entry date and expiry date (no stored column).
export function calculateDte(entryDate: string | null, expiry: string | null): number | null {
  if (!entryDate || !expiry) return null;
  const entry = new Date(entryDate);
  const exp = new Date(expiry);
  const diff = exp.getTime() - entry.getTime();
  if (diff < 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Status from exit legs (authoritative when legs exist).
// Partial = some quantity exited. Closed = full quantity exited.
function deriveStatusFromLegs(
  legs: ExitLeg[],
  positionSize: number,
): 'partial' | 'closed' | null {
  if (legs.length === 0) return null;
  const exited = legs.reduce((sum, leg) => sum + leg.quantity, 0);
  if (exited >= positionSize) return 'closed';
  return 'partial';
}

// Status derivation. If exit legs exist, they are authoritative.
// Top-level exitDate is only used when no legs exist.
export function deriveStatus(
  trade: Trade,
  legs: ExitLeg[] = [],
): 'open' | 'partial' | 'closed' {
  const fromLegs = deriveStatusFromLegs(legs, trade.positionSize);
  if (fromLegs !== null) return fromLegs;
  return trade.exitDate ? 'closed' : 'open';
}

// Single-exit gross P&L. When exit legs exist, returns null (use calculateExitLegsPnl instead).
export function calculateGrossPnl(trade: Trade, legs: ExitLeg[] = []): number | null {
  if (legs.length > 0) return null;
  if (trade.exitPrice == null) return null;
  const dirMultiplier = trade.direction === 'long' ? 1 : -1;
  const size = getEffectiveSize(trade);
  return (trade.exitPrice - trade.entryPrice) * size * dirMultiplier;
}

// Multi-leg gross P&L — sums across all exit legs with correct size multiplier.
export function calculateExitLegsPnl(trade: Trade, legs: ExitLeg[]): number | null {
  if (legs.length === 0) return null;
  const dirMultiplier = trade.direction === 'long' ? 1 : -1;
  const multiplier = getPositionMultiplier(trade);
  return legs.reduce((sum, leg) => {
    const legGross = (leg.exitPrice - trade.entryPrice) * leg.quantity * multiplier * dirMultiplier;
    const legFees = leg.fees ?? 0;
    return sum + legGross - legFees;
  }, 0);
}

// Net P&L — subtracts trade-level commissions/fees.
// For crypto trades also subtracts maker/taker/network fees.
export function calculateNetPnl(grossPnl: number | null, trade: Trade): number | null {
  if (grossPnl == null) return null;
  const base = grossPnl - (trade.commissions ?? 0) - (trade.fees ?? 0);
  if (trade.assetClass === 'crypto') {
    return base - (trade.makerFee ?? 0) - (trade.takerFee ?? 0) - (trade.networkFee ?? 0);
  }
  return base;
}

// P&L as a percentage of notional cost.
export function calculatePnlPercent(netPnl: number | null, trade: Trade): number | null {
  if (netPnl == null) return null;
  const cost = trade.entryPrice * getEffectiveSize(trade);
  if (cost === 0) return null;
  return (netPnl / cost) * 100;
}

export function calculateRMultiple(netPnl: number | null, trade: Trade): number | null {
  if (netPnl == null || trade.plannedStopLoss == null) return null;
  const dollarRisk =
    Math.abs(trade.entryPrice - trade.plannedStopLoss) * getEffectiveSize(trade);
  if (dollarRisk === 0) return null;
  return netPnl / dollarRisk;
}

export function calculateHoldingDays(trade: Trade): number | null {
  if (!trade.entryDate || !trade.exitDate) return null;
  const entry = new Date(trade.entryDate);
  const exit = new Date(trade.exitDate);
  return Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
}

export function enrichTradeWithCalculations(
  trade: Trade,
  exitLegs: ExitLeg[] = [],
): TradeWithCalculations {
  const grossPnl =
    exitLegs.length > 0
      ? calculateExitLegsPnl(trade, exitLegs)
      : calculateGrossPnl(trade);
  const netPnl = calculateNetPnl(grossPnl, trade);
  const totalExitedQuantity = exitLegs.reduce((sum, leg) => sum + leg.quantity, 0);

  return {
    ...trade,
    grossPnl,
    netPnl,
    pnlPercent: calculatePnlPercent(netPnl, trade),
    rMultiple: calculateRMultiple(netPnl, trade),
    holdingDays: calculateHoldingDays(trade),
    dte: calculateDte(trade.entryDate, trade.expiry),
    status: deriveStatus(trade, exitLegs),
    exitLegs,
    totalExitedQuantity,
  };
}
