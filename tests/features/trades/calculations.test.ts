import { describe, it, expect } from 'vitest';
import {
  deriveStatus,
  calculateGrossPnl,
  calculateNetPnl,
  calculatePnlPercent,
  calculateRMultiple,
  calculateHoldingDays,
  calculateExitLegsPnl,
  calculateDte,
  getPositionMultiplier,
  enrichTradeWithCalculations,
} from '@/features/trades/services/calculations';
import type { Trade, ExitLeg } from '@/features/trades/types';

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
    optionType: null,
    strike: null,
    expiry: null,
    contracts: null,
    contractMultiplier: 100,
    delta: null,
    gamma: null,
    theta: null,
    vega: null,
    iv: null,
    ivRank: null,
    spreadId: null,
    spreadType: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    ...overrides,
  } as Trade;
}

function makeExitLeg(overrides: Partial<ExitLeg> = {}): ExitLeg {
  return {
    id: 'leg-id',
    tradeId: 'test-id',
    exitDate: '2024-01-20T15:00:00.000Z',
    exitPrice: 110,
    quantity: 50,
    exitReason: null,
    fees: 0,
    notes: null,
    createdAt: '2024-01-20T15:00:00.000Z',
    ...overrides,
  };
}

describe('deriveStatus', () => {
  it('returns open when no exit date and no legs', () => {
    expect(deriveStatus(makeTrade({ exitDate: null }))).toBe('open');
  });

  it('returns closed when exit date exists and no legs', () => {
    expect(deriveStatus(makeTrade({ exitDate: '2024-01-20T15:00:00.000Z' }))).toBe('closed');
  });

  it('returns partial when legs sum to less than positionSize', () => {
    const trade = makeTrade({ positionSize: 100, exitDate: null });
    const legs = [makeExitLeg({ quantity: 50 })];
    expect(deriveStatus(trade, legs)).toBe('partial');
  });

  it('returns closed when legs sum to positionSize', () => {
    const trade = makeTrade({ positionSize: 100, exitDate: null });
    const legs = [makeExitLeg({ quantity: 60 }), makeExitLeg({ quantity: 40 })];
    expect(deriveStatus(trade, legs)).toBe('closed');
  });

  it('legs take precedence over exitDate when both present', () => {
    const trade = makeTrade({ positionSize: 100, exitDate: '2024-01-20T15:00:00.000Z' });
    const legs = [makeExitLeg({ quantity: 50 })];
    // legs are authoritative — partial even though exitDate is set
    expect(deriveStatus(trade, legs)).toBe('partial');
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

  it('returns null when exit legs exist (defers to calculateExitLegsPnl)', () => {
    const trade = makeTrade({ exitPrice: 110 });
    const legs = [makeExitLeg()];
    expect(calculateGrossPnl(trade, legs)).toBeNull();
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
    expect(enriched.exitLegs).toEqual([]);
    expect(enriched.totalExitedQuantity).toBe(0);
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

describe('getPositionMultiplier', () => {
  it('returns 1 for stock trades', () => {
    expect(getPositionMultiplier(makeTrade({ assetClass: 'stock' }))).toBe(1);
  });

  it('returns 1 for crypto trades', () => {
    expect(getPositionMultiplier(makeTrade({ assetClass: 'crypto' }))).toBe(1);
  });

  it('returns 100 for option trades (default multiplier)', () => {
    expect(getPositionMultiplier(makeTrade({ assetClass: 'option' }))).toBe(100);
  });

  it('returns custom contractMultiplier for option trades', () => {
    expect(getPositionMultiplier(makeTrade({ assetClass: 'option', contractMultiplier: 10 }))).toBe(10);
  });
});

describe('calculateDte', () => {
  it('calculates days to expiry from entry date', () => {
    expect(calculateDte('2024-01-15T10:00:00.000Z', '2024-02-16')).toBeGreaterThan(0);
  });

  it('returns null when entry date is null', () => {
    expect(calculateDte(null, '2024-02-16')).toBeNull();
  });

  it('returns null when expiry is null', () => {
    expect(calculateDte('2024-01-15T10:00:00.000Z', null)).toBeNull();
  });

  it('returns null when expiry is before entry', () => {
    expect(calculateDte('2024-02-20T10:00:00.000Z', '2024-01-15')).toBeNull();
  });
});

describe('option P&L calculations', () => {
  it('calculates long call profit with 100x multiplier', () => {
    // Entry $2.00, exit $5.00, 10 contracts × 100 = $3000
    const trade = makeTrade({
      assetClass: 'option',
      direction: 'long',
      entryPrice: 2.0,
      exitPrice: 5.0,
      positionSize: 1,
      contracts: 10,
      contractMultiplier: 100,
    });
    expect(calculateGrossPnl(trade)).toBe(3000);
  });

  it('calculates short put profit (sell high, buy low)', () => {
    // Sold put at $3.00, bought back at $1.00, 5 contracts × 100 = $1000
    const trade = makeTrade({
      assetClass: 'option',
      direction: 'short',
      entryPrice: 3.0,
      exitPrice: 1.0,
      positionSize: 1,
      contracts: 5,
      contractMultiplier: 100,
    });
    expect(calculateGrossPnl(trade)).toBe(1000);
  });

  it('calculates loss when long call expires worthless', () => {
    const trade = makeTrade({
      assetClass: 'option',
      direction: 'long',
      entryPrice: 2.5,
      exitPrice: 0,
      positionSize: 1,
      contracts: 4,
      contractMultiplier: 100,
    });
    // exitPrice 0 fails positive validation but at calc level: (0-2.5)*4*100*1 = -1000
    expect(calculateGrossPnl(trade)).toBe(-1000);
  });

  it('uses custom contractMultiplier (mini options = 10)', () => {
    const trade = makeTrade({
      assetClass: 'option',
      direction: 'long',
      entryPrice: 1.0,
      exitPrice: 3.0,
      positionSize: 1,
      contracts: 2,
      contractMultiplier: 10,
    });
    expect(calculateGrossPnl(trade)).toBe(40); // (3-1)*2*10
  });

  it('calculates P&L percent based on option notional cost', () => {
    // Entry $2.00, 10 contracts × 100 = $2000 notional
    const trade = makeTrade({
      assetClass: 'option',
      direction: 'long',
      entryPrice: 2.0,
      exitPrice: 4.0,
      positionSize: 1,
      contracts: 10,
      contractMultiplier: 100,
    });
    // gross = $2000, cost = 2*10*100 = $2000, pnl% = 100%
    expect(calculatePnlPercent(2000, trade)).toBe(100);
  });
});

describe('crypto P&L calculations', () => {
  it('calculates basic crypto trade P&L', () => {
    const trade = makeTrade({
      assetClass: 'crypto',
      direction: 'long',
      entryPrice: 50000,
      exitPrice: 51000,
      positionSize: 1,
    });
    expect(calculateGrossPnl(trade)).toBe(1000);
  });

  it('subtracts crypto-specific fees from net P&L', () => {
    const trade = makeTrade({
      assetClass: 'crypto',
      direction: 'long',
      entryPrice: 50000,
      exitPrice: 51000,
      positionSize: 1,
      makerFee: 5,
      takerFee: 5,
      networkFee: 2,
    });
    // gross = 1000, net = 1000 - 5 - 5 - 2 = 988
    expect(calculateNetPnl(1000, trade)).toBe(988);
  });

  it('does not subtract crypto fees for stock trades', () => {
    const trade = makeTrade({
      assetClass: 'stock',
      makerFee: 5,
      takerFee: 5,
    });
    expect(calculateNetPnl(1000, trade)).toBe(1000);
  });
});

describe('calculateExitLegsPnl', () => {
  it('returns null for empty legs array', () => {
    expect(calculateExitLegsPnl(makeTrade(), [])).toBeNull();
  });

  it('sums P&L across multiple exit legs', () => {
    const trade = makeTrade({ entryPrice: 100, direction: 'long', positionSize: 100 });
    const legs = [
      makeExitLeg({ exitPrice: 110, quantity: 60, fees: 0 }),
      makeExitLeg({ exitPrice: 115, quantity: 40, fees: 0 }),
    ];
    // leg1: (110-100)*60 = 600, leg2: (115-100)*40 = 600, total = 1200
    expect(calculateExitLegsPnl(trade, legs)).toBe(1200);
  });

  it('subtracts per-leg fees', () => {
    const trade = makeTrade({ entryPrice: 100, direction: 'long', positionSize: 100 });
    const legs = [makeExitLeg({ exitPrice: 110, quantity: 100, fees: 10 })];
    // gross leg = 1000, minus fees 10 = 990
    expect(calculateExitLegsPnl(trade, legs)).toBe(990);
  });

  it('applies 100x multiplier for option exit legs', () => {
    const trade = makeTrade({
      assetClass: 'option',
      direction: 'long',
      entryPrice: 2.0,
      contracts: 10,
      contractMultiplier: 100,
    });
    const legs = [makeExitLeg({ exitPrice: 5.0, quantity: 10, fees: 0 })];
    // (5-2)*10*100 = 3000
    expect(calculateExitLegsPnl(trade, legs)).toBe(3000);
  });

  it('handles short direction correctly with legs', () => {
    const trade = makeTrade({ entryPrice: 100, direction: 'short', positionSize: 50 });
    const legs = [makeExitLeg({ exitPrice: 90, quantity: 50, fees: 0 })];
    // short: (90-100)*50*-1 = 500 profit
    expect(calculateExitLegsPnl(trade, legs)).toBe(500);
  });
});

describe('enrichTradeWithCalculations — exit legs', () => {
  it('uses exit legs P&L when legs exist', () => {
    const trade = makeTrade({ entryPrice: 100, direction: 'long', positionSize: 100 });
    const legs = [makeExitLeg({ exitPrice: 110, quantity: 100, fees: 0 })];
    const enriched = enrichTradeWithCalculations(trade, legs);
    expect(enriched.grossPnl).toBe(1000);
    expect(enriched.status).toBe('closed');
    expect(enriched.totalExitedQuantity).toBe(100);
    expect(enriched.exitLegs).toHaveLength(1);
  });

  it('reports partial status when legs do not cover full position', () => {
    const trade = makeTrade({ entryPrice: 100, direction: 'long', positionSize: 100 });
    const legs = [makeExitLeg({ exitPrice: 110, quantity: 60, fees: 0 })];
    const enriched = enrichTradeWithCalculations(trade, legs);
    expect(enriched.status).toBe('partial');
    expect(enriched.totalExitedQuantity).toBe(60);
  });
});
