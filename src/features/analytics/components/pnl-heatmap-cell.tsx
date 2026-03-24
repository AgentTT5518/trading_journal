'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CalendarDay } from '../types';
import { getPnlColorClass } from '../utils/color-tiers';
import { formatCurrency } from '@/shared/utils/formatting';

type PnlHeatmapCellProps = {
  day: CalendarDay;
  maxProfit: number;
  maxLoss: number;
};

export function PnlHeatmapCell({ day, maxProfit, maxLoss }: PnlHeatmapCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close tooltip on outside touch
  useEffect(() => {
    if (!showTooltip) return;

    function handleTouchOutside(e: TouchEvent) {
      if (cellRef.current && !cellRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    }

    document.addEventListener('touchstart', handleTouchOutside);
    return () => document.removeEventListener('touchstart', handleTouchOutside);
  }, [showTooltip]);

  if (!day.isCurrentMonth) {
    return <div className="aspect-square" />;
  }

  const colorClass = getPnlColorClass(
    day.pnl?.netPnl ?? null,
    maxProfit,
    maxLoss,
  );

  const isClickable = day.pnl !== null;

  const tooltipText = day.pnl
    ? `${day.date} — ${formatCurrency(day.pnl.netPnl)} (${day.pnl.tradeCount} trade${day.pnl.tradeCount !== 1 ? 's' : ''}) · Click to view`
    : `${day.date} — No trades`;

  return (
    <div
      ref={cellRef}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={(e) => {
        // Toggle tooltip on tap (don't prevent default — allows click-through)
        if (!showTooltip) {
          e.preventDefault();
          setShowTooltip(true);
        }
      }}
    >
      <div
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        className={`aspect-square rounded-sm flex items-center justify-center text-xs font-medium transition-opacity ${colorClass} ${
          isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        }`}
        onClick={() => {
          if (isClickable) router.push(`/trades?date=${day.date}`);
        }}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            router.push(`/trades?date=${day.date}`);
          }
        }}
      >
        {day.dayOfMonth}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md ring-1 ring-border">
          {tooltipText}
        </div>
      )}
    </div>
  );
}
