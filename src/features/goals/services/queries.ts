import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getTrades } from '@/features/trades/services/queries';
import { log } from '../logger';
import type { Goal, GoalWithProgress, GoalPeriod } from '../types';
import type { TradeWithCalculations } from '@/features/trades/types';

// ─── Pure Helpers ────────────────────────────────────────────────────────────

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDateRangeForPeriod(
  period: GoalPeriod,
  refDate: Date = new Date()
): { from: string; to: string } {
  if (period === 'monthly') {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    return { from: formatLocalDate(from), to: formatLocalDate(to) };
  }

  // Weekly: Monday to Sunday
  const day = refDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    from: formatLocalDate(monday),
    to: formatLocalDate(sunday),
  };
}

export function getDaysInPeriod(period: GoalPeriod, refDate: Date = new Date()): {
  elapsed: number;
  total: number;
} {
  if (period === 'monthly') {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const total = new Date(year, month + 1, 0).getDate();
    const elapsed = refDate.getDate();
    return { elapsed, total };
  }

  // Weekly
  const day = refDate.getDay();
  const elapsed = day === 0 ? 7 : day;
  return { elapsed, total: 7 };
}

export function computeGoalProgress(
  goal: Goal,
  trades: TradeWithCalculations[],
  refDate: Date = new Date()
): GoalWithProgress {
  const { from, to } = getDateRangeForPeriod(goal.period as GoalPeriod, refDate);
  const { elapsed, total } = getDaysInPeriod(goal.period as GoalPeriod, refDate);
  const pacePercent = (elapsed / total) * 100;

  // Filter trades to the goal's period
  const periodTrades = trades.filter((t) => {
    const entryDate = t.entryDate.split('T')[0];
    return entryDate >= from && entryDate <= to;
  });

  const closedTrades = periodTrades.filter((t) => t.status === 'closed');

  let currentValue = 0;
  let progressPercent = 0;
  let isOnTrack = true;
  let isExceeded = false;

  switch (goal.goalType) {
    case 'monthly_pnl': {
      currentValue = closedTrades.reduce((sum, t) => sum + (t.netPnl ?? 0), 0);
      progressPercent = goal.targetValue !== 0
        ? (currentValue / goal.targetValue) * 100
        : 0;
      isOnTrack = progressPercent >= pacePercent;
      break;
    }

    case 'max_loss': {
      // Inverted logic: target is a ceiling (max acceptable loss)
      // currentValue = total loss (absolute value of losing trades' P&L)
      const totalLoss = closedTrades
        .filter((t) => (t.netPnl ?? 0) < 0)
        .reduce((sum, t) => sum + Math.abs(t.netPnl ?? 0), 0);
      currentValue = totalLoss;
      progressPercent = goal.targetValue !== 0
        ? (totalLoss / goal.targetValue) * 100
        : 0;
      isExceeded = totalLoss >= goal.targetValue;
      isOnTrack = progressPercent < 80;
      break;
    }

    case 'trade_count': {
      currentValue = periodTrades.length;
      progressPercent = goal.targetValue !== 0
        ? (currentValue / goal.targetValue) * 100
        : 0;
      isOnTrack = progressPercent >= pacePercent;
      break;
    }

    case 'win_rate': {
      if (closedTrades.length === 0) {
        currentValue = 0;
        progressPercent = 0;
        isOnTrack = true;
      } else {
        const wins = closedTrades.filter((t) => (t.netPnl ?? 0) > 0).length;
        currentValue = (wins / closedTrades.length) * 100;
        progressPercent = goal.targetValue !== 0
          ? (currentValue / goal.targetValue) * 100
          : 0;
        // Win rate is not pace-dependent — it's a ratio, not cumulative
        isOnTrack = currentValue >= goal.targetValue;
      }
      break;
    }
  }

  return {
    ...goal,
    currentValue,
    progressPercent: Math.min(progressPercent, 200), // Cap at 200% for display
    pacePercent,
    isOnTrack,
    isExceeded,
  };
}

export function computeAllGoalsProgress(
  goalsList: Goal[],
  trades: TradeWithCalculations[],
  refDate?: Date
): GoalWithProgress[] {
  return goalsList.map((goal) => computeGoalProgress(goal, trades, refDate));
}

// ─── Async Wrappers ──────────────────────────────────────────────────────────

export async function getGoals(): Promise<Goal[]> {
  try {
    return await db.query.goals.findMany({
      orderBy: [desc(goals.createdAt)],
    });
  } catch (error) {
    log.error('Failed to fetch goals', error as Error);
    throw error;
  }
}

export async function getGoalById(id: string): Promise<Goal | null> {
  try {
    const row = await db.query.goals.findFirst({
      where: (g, { eq }) => eq(g.id, id),
    });
    return row ?? null;
  } catch (error) {
    log.error('Failed to fetch goal', error as Error, { goalId: id });
    throw error;
  }
}

export async function getGoalsWithProgress(refDate?: Date): Promise<GoalWithProgress[]> {
  try {
    const [goalsList, allTrades] = await Promise.all([
      getGoals(),
      getTrades(),
    ]);

    return computeAllGoalsProgress(goalsList, allTrades, refDate);
  } catch (error) {
    log.error('Failed to fetch goals with progress', error as Error);
    throw error;
  }
}
