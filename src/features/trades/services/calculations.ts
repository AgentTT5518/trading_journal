import type { Trade, TradeWithCalculations } from '../types';

export function deriveStatus(trade: Trade): 'open' | 'closed' {
  return trade.exitDate ? 'closed' : 'open';
}

export function calculateGrossPnl(trade: Trade): number | null {
  if (trade.exitPrice == null) return null;
  const dirMultiplier = trade.direction === 'long' ? 1 : -1;
  return (trade.exitPrice - trade.entryPrice) * trade.positionSize * dirMultiplier;
}

export function calculateNetPnl(grossPnl: number | null, trade: Trade): number | null {
  if (grossPnl == null) return null;
  return grossPnl - (trade.commissions ?? 0) - (trade.fees ?? 0);
}

export function calculatePnlPercent(netPnl: number | null, trade: Trade): number | null {
  if (netPnl == null) return null;
  const cost = trade.entryPrice * trade.positionSize;
  if (cost === 0) return null;
  return (netPnl / cost) * 100;
}

export function calculateRMultiple(netPnl: number | null, trade: Trade): number | null {
  if (netPnl == null || trade.plannedStopLoss == null) return null;
  const dollarRisk =
    Math.abs(trade.entryPrice - trade.plannedStopLoss) * trade.positionSize;
  if (dollarRisk === 0) return null;
  return netPnl / dollarRisk;
}

export function calculateHoldingDays(trade: Trade): number | null {
  if (!trade.entryDate || !trade.exitDate) return null;
  const entry = new Date(trade.entryDate);
  const exit = new Date(trade.exitDate);
  return Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
}

export function enrichTradeWithCalculations(trade: Trade): TradeWithCalculations {
  const grossPnl = calculateGrossPnl(trade);
  const netPnl = calculateNetPnl(grossPnl, trade);
  return {
    ...trade,
    grossPnl,
    netPnl,
    pnlPercent: calculatePnlPercent(netPnl, trade),
    rMultiple: calculateRMultiple(netPnl, trade),
    holdingDays: calculateHoldingDays(trade),
    status: deriveStatus(trade),
  };
}
