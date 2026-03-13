import { z } from 'zod/v4';

export const tradeInsertSchema = z
  .object({
    assetClass: z.enum(['stock', 'option', 'crypto']),
    ticker: z.string().min(1, 'Ticker is required').max(20).transform((v) => v.toUpperCase()),
    direction: z.enum(['long', 'short']),
    entryDate: z.string().min(1, 'Entry date is required'),
    entryPrice: z.number().positive('Entry price must be positive'),
    positionSize: z.number().positive('Position size must be positive'),
    orderType: z.enum(['market', 'limit', 'stop_limit']).optional(),
    entryTrigger: z.string().optional(),
    exitDate: z.string().optional().nullable(),
    exitPrice: z.number().positive().optional().nullable(),
    exitReason: z
      .enum(['target_hit', 'stop_hit', 'trailing_stop', 'time_based', 'discretionary', 'other'])
      .optional()
      .nullable(),
    commissions: z.number().min(0).default(0),
    fees: z.number().min(0).default(0),
    notes: z.string().optional(),

    // Options fields
    optionType: z.enum(['call', 'put']).optional().nullable(),
    strike: z.number().positive().optional().nullable(),
    expiry: z.string().optional().nullable(),
    contracts: z.number().positive().optional().nullable(),
    contractMultiplier: z.number().positive().default(100),
    delta: z.number().optional().nullable(),
    gamma: z.number().optional().nullable(),
    theta: z.number().optional().nullable(),
    vega: z.number().optional().nullable(),
    iv: z.number().min(0).optional().nullable(),
    ivRank: z.number().min(0).max(100).optional().nullable(),
    spreadId: z.string().optional().nullable(),
    spreadType: z
      .enum(['vertical', 'iron_condor', 'straddle', 'strangle', 'butterfly', 'calendar', 'diagonal', 'custom'])
      .optional()
      .nullable(),

    // Psychology fields (Phase 4)
    preMood: z.number().int().min(1).max(10).optional().nullable(),
    preConfidence: z.number().int().min(1).max(10).optional().nullable(),
    fomoFlag: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).optional().nullable(),
    revengeFlag: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).optional().nullable(),
    anxietyDuring: z.number().int().min(1).max(10).optional().nullable(),
    urgeToExitEarly: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).optional().nullable(),
    urgeToAdd: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).optional().nullable(),
    executionSatisfaction: z.number().int().min(1).max(10).optional().nullable(),
    lessonsLearned: z.string().optional().nullable(),
    tradeGrade: z.enum(['A', 'B', 'C', 'D', 'F']).optional().nullable(),

    // Swing context (Phase 5)
    plannedHoldDays: z.number().int().positive().optional().nullable(),
    heldOverWeekend: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).optional().nullable(),
    heldThroughEarnings: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).optional().nullable(),
    heldThroughMacro: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).optional().nullable(),

    // Market context (Phase 5)
    weeklyTrend: z.enum(['up', 'down', 'sideways']).optional().nullable(),
    marketRegime: z.enum(['trending', 'choppy', 'high_vol', 'low_vol']).optional().nullable(),
    vixLevel: z.number().min(0).optional().nullable(),
    supportLevel: z.number().positive().optional().nullable(),
    resistanceLevel: z.number().positive().optional().nullable(),
    sectorPerformance: z.string().optional().nullable(),
    upcomingCatalysts: z.string().optional().nullable(),

    // Technical context (Phase 5)
    rsiAtEntry: z.number().min(0).max(100).optional().nullable(),
    macdAtEntry: z.string().optional().nullable(),
    distanceFrom50ma: z.number().optional().nullable(),
    distanceFrom200ma: z.number().optional().nullable(),
    volumeProfile: z.enum(['above_avg', 'below_avg', 'avg']).optional().nullable(),
    atrAtEntry: z.number().min(0).optional().nullable(),

    // Crypto fields
    exchange: z.string().optional().nullable(),
    tradingPair: z.string().optional().nullable(),
    makerFee: z.number().min(0).optional().nullable(),
    takerFee: z.number().min(0).optional().nullable(),
    networkFee: z.number().min(0).optional().nullable(),
    fundingRate: z.number().optional().nullable(),
    leverage: z.number().min(1).optional().nullable(),
    liquidationPrice: z.number().positive().optional().nullable(),
    marketCapCategory: z.enum(['large', 'mid', 'small', 'micro']).optional().nullable(),
    tokenType: z.string().optional().nullable(),
    btcDominance: z.number().min(0).max(100).optional().nullable(),
    btcCorrelation: z.number().min(-1).max(1).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.assetClass === 'option') {
      if (!data.optionType) {
        ctx.addIssue({ code: 'custom', path: ['optionType'], message: 'Option type is required' });
      }
      if (data.strike == null) {
        ctx.addIssue({ code: 'custom', path: ['strike'], message: 'Strike price is required' });
      }
      if (!data.expiry) {
        ctx.addIssue({ code: 'custom', path: ['expiry'], message: 'Expiry date is required' });
      }
      if (data.contracts == null) {
        ctx.addIssue({ code: 'custom', path: ['contracts'], message: 'Number of contracts is required' });
      }
    }
  });

export type TradeInsertInput = z.infer<typeof tradeInsertSchema>;

export const exitLegInsertSchema = z.object({
  exitDate: z.string().min(1, 'Exit date is required'),
  exitPrice: z.number().positive('Exit price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  exitReason: z.string().optional().nullable(),
  fees: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export type ExitLegInsertInput = z.infer<typeof exitLegInsertSchema>;
