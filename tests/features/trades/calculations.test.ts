import { describe, it, expect } from 'vitest';
import {
  deriveStatus,
  calculateGrossPnl,
  calculateNetPnl,
  calculatePnlPercent,
  calculateRMultiple,
  calculateHoldingDays,
  enrichTradeWithCalculations,
} from '@/features/trades/services/calculations';
import type { Trade } from '@/features/trades/types';

function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: 'test-id',
    assetClass: 'stock',
    ticker: 'AAPL',
    direction: 'long',
    entryDate: '2024-01-15T10:00:00.000Z',
    entryPrice: 100,
    positionSize: 100,
    orderType: 'limit',
    entryTrigger: null,
    exitDate: '2024-01-20T15:00:00.000Z',
    exitPrice: 110,
    exitReason: 'target_hit',
    plannedStopLoss: null,
    actualStopLoss: null,
    plannedTarget1: null,
    plannedTarget2: null,
    plannedTarget3: null,
    riskRewardPlanned: null,
    commissions: 0,
    fees: 0,
    notes: null,
    preMood: null,
    preConfidence: null,
    fomoFlag: false,
    revengeFlag: false,
    anxietyDuring: null,
    urgeToExitEarly: null,
    urgeToAdd: null,
    executionSatisfaction: null,
    lessonsLearned: null,
    tradeGrade: null,
    plannedHoldDays: null,
    heldOverWeekend: null,
    heldThroughEarnings: null,
    heldThroughMacro: null,
    weeklyTrend: null,
    marketRegime: null,
    vixLevel: null,
    supportLevel: null,
    resistanceLevel: null,
    sectorPerformance: null,
    upcomingCatalysts: null,
    rsiAtEntry: null,
    macdAtEntry: null,
    distanceFrom50ma: null,
    distanceFrom200ma: null,
    volumeProfile: null,
    atrAtEntry: null,
    exchange: null,
    tradingPair: null,
    makerFee: null,
    takerFee: null,
    networkFee: null,
    fundingRate: null,
    leverage: null,
    liquidationPrice: null,
    marketCapCategory: null,
    tokenType: null,
    btcDominance: null,
    btcCorrelation: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  } as Trade;
}

describe('deriveStatus', () => {
  it('returns open when no exit date', () => {
    expect(deriveStatus(makeTrade({ exitDate: null }))).toBe('open');
  });

  it('returns closed when exit date exists', () => {
    expect(deriveStatus(makeTrade({ exitDate: '2024-01-20T15:00:00.000Z' }))).toBe('closed');
  });
});

describe('calculateGrossPnl', () => {
  it('calculates long trade profit', () => {
    const trade = makeTrade({ entryPrice: 100, exitPrice: 110, positionSize: 100, direction: 'long' });
    expect(calculateGrossPnl(trade)).toBe(1000);
  });

  it('calculates long trade loss', () => {
    const trade = makeTrade({ entryPrice: 100, exitPrice: 90, positionSize: 100, direction: 'long' });
    expect(calculateGrossPnl(trade)).toBe(-1000);
  });

  it('calculates short trade profit', () => {
    const trade = makeTrade({ entryPrice: 100, exitPrice: 90, positionSize: 100, direction: 'short' });
    expect(calculateGrossPnl(trade)).toBe(1000);
  });

  it('calculates short trade loss', () => {
    const trade = makeTrade({ entryPrice: 100, exitPrice: 110, positionSize: 100, direction: 'short' });
    expect(calculateGrossPnl(trade)).toBe(-1000);
  });

  it('returns null for open trade (no exit price)', () => {
    const trade = makeTrade({ exitPrice: null });
    expect(calculateGrossPnl(trade)).toBeNull();
  });
});

describe('calculateNetPnl', () => {
  it('subtracts commissions and fees', () => {
    const trade = makeTrade({ commissions: 5, fees: 2 });
    expect(calculateNetPnl(1000, trade)).toBe(993);
  });

  it('returns null when gross is null', () => {
    expect(calculateNetPnl(null, makeTrade())).toBeNull();
  });
});

describe('calculatePnlPercent', () => {
  it('calculates percentage return', () => {
    const trade = makeTrade({ entryPrice: 100, positionSize: 100 });
    expect(calculatePnlPercent(1000, trade)).toBe(10);
  });

  it('returns null when net pnl is null', () => {
    expect(calculatePnlPercent(null, makeTrade())).toBeNull();
  });
});

describe('calculateRMultiple', () => {
  it('calculates R-multiple with planned stop', () => {
    const trade = makeTrade({ entryPrice: 100, plannedStopLoss: 95, positionSize: 100 });
    // risk = |100 - 95| * 100 = 500, net pnl = 1000 => R = 2.0
    expect(calculateRMultiple(1000, trade)).toBe(2);
  });

  it('returns null without planned stop', () => {
    const trade = makeTrade({ plannedStopLoss: null });
    expect(calculateRMultiple(1000, trade)).toBeNull();
  });

  it('returns null when net pnl is null', () => {
    const trade = makeTrade({ plannedStopLoss: 95 });
    expect(calculateRMultiple(null, trade)).toBeNull();
  });
});

describe('calculateHoldingDays', () => {
  it('calculates days between entry and exit', () => {
    const trade = makeTrade({
      entryDate: '2024-01-15T10:00:00.000Z',
      exitDate: '2024-01-20T15:00:00.000Z',
    });
    expect(calculateHoldingDays(trade)).toBe(6);
  });

  it('returns null for open trade', () => {
    const trade = makeTrade({ exitDate: null });
    expect(calculateHoldingDays(trade)).toBeNull();
  });
});

describe('enrichTradeWithCalculations', () => {
  it('adds all computed fields', () => {
    const trade = makeTrade({
      entryPrice: 100,
      exitPrice: 110,
      positionSize: 100,
      direction: 'long',
      commissions: 5,
      fees: 2,
      plannedStopLoss: 95,
    });
    const enriched = enrichTradeWithCalculations(trade);

    expect(enriched.grossPnl).toBe(1000);
    expect(enriched.netPnl).toBe(993);
    expect(enriched.pnlPercent).toBeCloseTo(9.93);
    expect(enriched.rMultiple).toBeCloseTo(1.986);
    expect(enriched.status).toBe('closed');
    expect(enriched.holdingDays).toBe(6);
  });

  it('handles open trade gracefully', () => {
    const trade = makeTrade({ exitDate: null, exitPrice: null });
    const enriched = enrichTradeWithCalculations(trade);

    expect(enriched.grossPnl).toBeNull();
    expect(enriched.netPnl).toBeNull();
    expect(enriched.pnlPercent).toBeNull();
    expect(enriched.rMultiple).toBeNull();
    expect(enriched.status).toBe('open');
    expect(enriched.holdingDays).toBeNull();
  });
});
