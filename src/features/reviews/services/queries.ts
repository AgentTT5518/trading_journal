'use server';

import { db } from '@/lib/db';
import { reviews, reviewTrades, trades } from '@/lib/db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { log } from '../logger';
import { computeReviewMetrics } from './metrics';
import type {
  ReviewWithTradeCount,
  ReviewWithMetrics,
  ReviewWithSnapshot,
  ReviewSnapshot,
  TradeSummary,
} from '../types';

export async function getReviews(): Promise<ReviewWithSnapshot[]> {
  try {
    const rows = await db
      .select({
        id: reviews.id,
        type: reviews.type,
        startDate: reviews.startDate,
        endDate: reviews.endDate,
        grade: reviews.grade,
        notes: reviews.notes,
        lessonsLearned: reviews.lessonsLearned,
        goalsForNext: reviews.goalsForNext,
        rulesFollowed: reviews.rulesFollowed,
        rulesBroken: reviews.rulesBroken,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        tradeCount: sql<number>`count(${reviewTrades.id})`.as('trade_count'),
      })
      .from(reviews)
      .leftJoin(reviewTrades, eq(reviews.id, reviewTrades.reviewId))
      .groupBy(reviews.id)
      .orderBy(desc(reviews.startDate));

    // Load all linked trade rows in one query for snapshot computation
    const linkedRows = await db
      .select({
        reviewId: reviewTrades.reviewId,
        direction: trades.direction,
        entryPrice: trades.entryPrice,
        exitPrice: trades.exitPrice,
        exitDate: trades.exitDate,
        positionSize: trades.positionSize,
        commissions: trades.commissions,
        fees: trades.fees,
      })
      .from(reviewTrades)
      .innerJoin(trades, eq(reviewTrades.tradeId, trades.id));

    const snapshotMap = new Map<string, ReviewSnapshot>();
    for (const r of linkedRows) {
      const existing = snapshotMap.get(r.reviewId) ?? {
        closedTradeCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: null,
        totalPnl: 0,
      };
      if (r.exitDate && r.exitPrice != null) {
        const gross =
          r.direction === 'long'
            ? (r.exitPrice - r.entryPrice) * r.positionSize
            : (r.entryPrice - r.exitPrice) * r.positionSize;
        const net = gross - (r.commissions ?? 0) - (r.fees ?? 0);
        existing.closedTradeCount += 1;
        existing.totalPnl += net;
        if (net > 0) existing.winCount += 1;
        else existing.lossCount += 1;
      }
      snapshotMap.set(r.reviewId, existing);
    }

    return (rows as ReviewWithTradeCount[]).map((review) => {
      const s = snapshotMap.get(review.id) ?? {
        closedTradeCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: null,
        totalPnl: 0,
      };
      const snapshot: ReviewSnapshot = {
        closedTradeCount: s.closedTradeCount,
        winCount: s.winCount,
        lossCount: s.lossCount,
        winRate:
          s.closedTradeCount > 0
            ? Math.round((s.winCount / s.closedTradeCount) * 100)
            : null,
        totalPnl: Math.round(s.totalPnl * 100) / 100,
      };
      return { ...review, snapshot };
    });
  } catch (error) {
    log.error('Failed to fetch reviews', error as Error);
    throw error;
  }
}

export async function getReviewById(id: string): Promise<ReviewWithMetrics | null> {
  try {
    const row = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (row.length === 0) return null;

    const review = row[0];

    // Get linked trade IDs
    const rtRows = await db
      .select({ tradeId: reviewTrades.tradeId })
      .from(reviewTrades)
      .where(eq(reviewTrades.reviewId, id));
    const tradeIds = rtRows.map((r) => r.tradeId);

    // Get trade data for metrics and summaries
    let metrics = computeReviewMetrics([]);
    let tradeSummaries: TradeSummary[] = [];

    if (tradeIds.length > 0) {
      const tradeRows = await db
        .select({
          id: trades.id,
          ticker: trades.ticker,
          entryDate: trades.entryDate,
          entryPrice: trades.entryPrice,
          exitPrice: trades.exitPrice,
          exitDate: trades.exitDate,
          direction: trades.direction,
          positionSize: trades.positionSize,
          commissions: trades.commissions,
          fees: trades.fees,
        })
        .from(trades)
        .where(sql`${trades.id} IN (${sql.join(tradeIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(trades.entryDate);

      metrics = computeReviewMetrics(tradeRows);

      tradeSummaries = tradeRows.map((t) => {
        const gross = t.exitPrice != null
          ? t.direction === 'long'
            ? (t.exitPrice - t.entryPrice) * t.positionSize
            : (t.entryPrice - t.exitPrice) * t.positionSize
          : 0;
        const net = gross - (t.commissions ?? 0) - (t.fees ?? 0);
        return {
          id: t.id,
          ticker: t.ticker,
          direction: t.direction,
          entryDate: t.entryDate,
          exitDate: t.exitDate,
          netPnl: Math.round(net * 100) / 100,
        };
      });
    }

    return { ...review, metrics, tradeIds, tradeSummaries };
  } catch (error) {
    log.error('Failed to fetch review by ID', error as Error, { reviewId: id });
    throw error;
  }
}

export async function getTradesByDateRange(
  startDate: string,
  endDate: string
): Promise<{ id: string; ticker: string; direction: string; entryDate: string; netPnl: number }[]> {
  try {
    const rows = await db
      .select({
        id: trades.id,
        ticker: trades.ticker,
        direction: trades.direction,
        entryDate: trades.entryDate,
        entryPrice: trades.entryPrice,
        exitPrice: trades.exitPrice,
        positionSize: trades.positionSize,
        commissions: trades.commissions,
        fees: trades.fees,
      })
      .from(trades)
      .where(and(gte(trades.entryDate, startDate), lte(trades.entryDate, endDate)))
      .orderBy(trades.entryDate);

    return rows.map((t) => {
      const gross = t.exitPrice
        ? t.direction === 'long'
          ? (t.exitPrice - t.entryPrice) * t.positionSize
          : (t.entryPrice - t.exitPrice) * t.positionSize
        : 0;
      const net = gross - (t.commissions ?? 0) - (t.fees ?? 0);
      return {
        id: t.id,
        ticker: t.ticker,
        direction: t.direction,
        entryDate: t.entryDate,
        netPnl: Math.round(net * 100) / 100,
      };
    });
  } catch (error) {
    log.error('Failed to fetch trades by date range', error as Error, { startDate, endDate });
    throw error;
  }
}
