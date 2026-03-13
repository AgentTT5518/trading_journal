'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PnlBadge } from '@/shared/components/pnl-badge';
import { LinkButton } from '@/shared/components/link-button';
import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatPrice,
} from '@/shared/utils/formatting';
import { deleteTrade } from '../services/actions';
import { ExitLegsSection } from './exit-legs-section';
import { TagBadge } from '@/features/playbooks/components/tag-badge';
import { ScreenshotGallery } from '@/features/screenshots/components/screenshot-gallery';
import { ScreenshotUpload } from '@/features/screenshots/components/screenshot-upload';
import type { TradeTagWithTag } from '@/features/playbooks/types';
import type { TagCategory } from '@/features/playbooks/types';
import type { Screenshot } from '@/features/screenshots/types';
import type { TradeWithCalculations } from '../types';
import { cn } from '@/lib/utils';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: 'open' | 'partial' | 'closed' }) {
  if (status === 'open') return <Badge variant="secondary">Open</Badge>;
  if (status === 'partial')
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
        Partial
      </Badge>
    );
  return <Badge variant="outline">Closed</Badge>;
}

interface TradeDetailProps {
  trade: TradeWithCalculations;
  tradeTags?: TradeTagWithTag[];
  screenshots?: Screenshot[];
}

export function TradeDetail({ trade, tradeTags = [], screenshots = [] }: TradeDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteTrade(trade.id);
    if (result.success) {
      toast.success('Trade deleted');
      router.push('/trades');
    } else {
      toast.error(result.message || 'Failed to delete trade');
      setIsDeleting(false);
    }
  }

  const isOption = trade.assetClass === 'option';
  const isCrypto = trade.assetClass === 'crypto';
  const usesExitLegs = trade.exitLegs.length > 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Trade Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Trade Info
            <StatusBadge status={trade.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <DetailRow label="Ticker" value={trade.ticker} />
          <DetailRow
            label="Direction"
            value={
              <Badge
                variant="outline"
                className={cn(
                  trade.direction === 'long'
                    ? 'border-green-500/50 text-green-700 dark:text-green-400'
                    : 'border-red-500/50 text-red-700 dark:text-red-400'
                )}
              >
                {trade.direction.toUpperCase()}
              </Badge>
            }
          />
          <DetailRow label="Asset Class" value={trade.assetClass} />
          <DetailRow label="Order Type" value={trade.orderType ?? '—'} />
          {trade.entryTrigger && (
            <DetailRow label="Entry Trigger" value={trade.entryTrigger} />
          )}
          {trade.spreadId && (
            <DetailRow
              label="Spread"
              value={`${trade.spreadType?.replace(/_/g, ' ') ?? 'Spread'} · ${trade.spreadId}`}
            />
          )}
        </CardContent>
      </Card>

      {/* P&L Summary */}
      <Card>
        <CardHeader>
          <CardTitle>P&L Summary</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <DetailRow label="Gross P&L" value={formatCurrency(trade.grossPnl)} />
          <DetailRow label="Net P&L" value={<PnlBadge value={trade.netPnl} />} />
          <DetailRow label="P&L %" value={formatPercent(trade.pnlPercent)} />
          <DetailRow
            label="R-Multiple"
            value={trade.rMultiple != null ? trade.rMultiple.toFixed(2) + 'R' : '—'}
          />
          <DetailRow
            label="Holding Days"
            value={trade.holdingDays != null ? `${trade.holdingDays} days` : '—'}
          />
          {isOption && trade.dte != null && (
            <DetailRow label="DTE at Entry" value={`${trade.dte}d`} />
          )}
        </CardContent>
      </Card>

      {/* Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Entry</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <DetailRow label="Date" value={formatDate(trade.entryDate)} />
          <DetailRow
            label={isOption ? 'Premium Paid' : 'Price'}
            value={formatPrice(trade.entryPrice)}
          />
          <DetailRow
            label={isOption ? 'Contracts' : 'Size'}
            value={
              isOption
                ? (trade.contracts ?? trade.positionSize).toLocaleString()
                : trade.positionSize.toLocaleString()
            }
          />
          <DetailRow
            label="Notional"
            value={formatCurrency(
              isOption
                ? trade.entryPrice *
                    (trade.contracts ?? trade.positionSize) *
                    (trade.contractMultiplier ?? 100)
                : trade.entryPrice * trade.positionSize
            )}
          />
        </CardContent>
      </Card>

      {/* Exit */}
      <Card>
        <CardHeader>
          <CardTitle>Exit</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {!usesExitLegs ? (
            <>
              <DetailRow label="Date" value={formatDate(trade.exitDate)} />
              <DetailRow
                label={isOption ? 'Exit Premium' : 'Price'}
                value={formatPrice(trade.exitPrice)}
              />
              <DetailRow label="Reason" value={trade.exitReason?.replace(/_/g, ' ') ?? '—'} />
            </>
          ) : (
            <DetailRow label="Exit Type" value="Exit Legs (see below)" />
          )}
          <DetailRow label="Commissions" value={formatCurrency(trade.commissions)} />
          <DetailRow label="Fees" value={formatCurrency(trade.fees)} />
        </CardContent>
      </Card>

      {/* Options Info Card */}
      {isOption && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Options Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow
                label="Option Type"
                value={
                  <Badge
                    variant="outline"
                    className={cn(
                      trade.optionType === 'call'
                        ? 'border-green-500/50 text-green-700 dark:text-green-400'
                        : 'border-red-500/50 text-red-700 dark:text-red-400'
                    )}
                  >
                    {trade.optionType?.toUpperCase() ?? '—'}
                  </Badge>
                }
              />
              <DetailRow
                label="Strike"
                value={trade.strike != null ? formatPrice(trade.strike) : '—'}
              />
              <DetailRow label="Expiry" value={trade.expiry ?? '—'} />
              <DetailRow
                label="Contracts"
                value={trade.contracts != null ? trade.contracts.toLocaleString() : '—'}
              />
              <DetailRow label="Multiplier" value={trade.contractMultiplier ?? 100} />
              {trade.dte != null && <DetailRow label="DTE at Entry" value={`${trade.dte}d`} />}
              {trade.iv != null && (
                <DetailRow label="IV at Entry" value={`${(trade.iv * 100).toFixed(1)}%`} />
              )}
              {trade.ivRank != null && (
                <DetailRow label="IV Rank" value={`${trade.ivRank.toFixed(0)}`} />
              )}
              {trade.delta != null && (
                <DetailRow label="Delta" value={trade.delta.toFixed(2)} />
              )}
              {trade.gamma != null && (
                <DetailRow label="Gamma" value={trade.gamma.toFixed(3)} />
              )}
              {trade.theta != null && (
                <DetailRow label="Theta" value={trade.theta.toFixed(2)} />
              )}
              {trade.vega != null && <DetailRow label="Vega" value={trade.vega.toFixed(2)} />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crypto Info Card */}
      {isCrypto && (trade.exchange || trade.tradingPair || trade.leverage != null) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Crypto Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {trade.exchange && <DetailRow label="Exchange" value={trade.exchange} />}
              {trade.tradingPair && <DetailRow label="Trading Pair" value={trade.tradingPair} />}
              {trade.leverage != null && (
                <DetailRow label="Leverage" value={`${trade.leverage}×`} />
              )}
              {trade.liquidationPrice != null && (
                <DetailRow
                  label="Liquidation Price"
                  value={formatPrice(trade.liquidationPrice)}
                />
              )}
              {trade.makerFee != null && (
                <DetailRow label="Maker Fee" value={formatCurrency(trade.makerFee)} />
              )}
              {trade.takerFee != null && (
                <DetailRow label="Taker Fee" value={formatCurrency(trade.takerFee)} />
              )}
              {trade.networkFee != null && (
                <DetailRow label="Network Fee" value={formatCurrency(trade.networkFee)} />
              )}
              {trade.fundingRate != null && (
                <DetailRow label="Funding Rate" value={trade.fundingRate.toFixed(4)} />
              )}
              {trade.marketCapCategory && (
                <DetailRow label="Market Cap" value={`${trade.marketCapCategory} cap`} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Swing Context */}
      {(trade.plannedHoldDays != null ||
        trade.heldOverWeekend ||
        trade.heldThroughEarnings ||
        trade.heldThroughMacro) && (
        <Card>
          <CardHeader>
            <CardTitle>Swing Context</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {trade.plannedHoldDays != null && (
              <DetailRow label="Planned Hold" value={`${trade.plannedHoldDays} days`} />
            )}
            {trade.heldOverWeekend && <DetailRow label="Held Over Weekend" value="Yes" />}
            {trade.heldThroughEarnings && <DetailRow label="Held Through Earnings" value="Yes" />}
            {trade.heldThroughMacro && <DetailRow label="Held Through Macro" value="Yes" />}
          </CardContent>
        </Card>
      )}

      {/* Market & Technical Context */}
      {(trade.weeklyTrend ||
        trade.marketRegime ||
        trade.vixLevel != null ||
        trade.rsiAtEntry != null ||
        trade.atrAtEntry != null) && (
        <Card>
          <CardHeader>
            <CardTitle>Market & Technical</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {trade.weeklyTrend && (
              <DetailRow
                label="Weekly Trend"
                value={
                  <Badge
                    variant="outline"
                    className={cn(
                      trade.weeklyTrend === 'up' && 'border-green-500/50 text-green-700 dark:text-green-400',
                      trade.weeklyTrend === 'down' && 'border-red-500/50 text-red-700 dark:text-red-400',
                      trade.weeklyTrend === 'sideways' && 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400'
                    )}
                  >
                    {trade.weeklyTrend.toUpperCase()}
                  </Badge>
                }
              />
            )}
            {trade.marketRegime && (
              <DetailRow
                label="Market Regime"
                value={
                  <Badge variant="outline">
                    {trade.marketRegime.replace(/_/g, ' ')}
                  </Badge>
                }
              />
            )}
            {trade.vixLevel != null && <DetailRow label="VIX" value={trade.vixLevel.toFixed(1)} />}
            {trade.supportLevel != null && <DetailRow label="Support" value={formatPrice(trade.supportLevel)} />}
            {trade.resistanceLevel != null && <DetailRow label="Resistance" value={formatPrice(trade.resistanceLevel)} />}
            {trade.rsiAtEntry != null && <DetailRow label="RSI" value={trade.rsiAtEntry.toFixed(1)} />}
            {trade.macdAtEntry && <DetailRow label="MACD" value={trade.macdAtEntry} />}
            {trade.distanceFrom50ma != null && <DetailRow label="Dist. 50-MA" value={`$${trade.distanceFrom50ma.toFixed(2)}`} />}
            {trade.distanceFrom200ma != null && <DetailRow label="Dist. 200-MA" value={`$${trade.distanceFrom200ma.toFixed(2)}`} />}
            {trade.volumeProfile && (
              <DetailRow label="Volume" value={trade.volumeProfile.replace(/_/g, ' ')} />
            )}
            {trade.atrAtEntry != null && <DetailRow label="ATR" value={trade.atrAtEntry.toFixed(2)} />}
            {trade.sectorPerformance && <DetailRow label="Sector" value={trade.sectorPerformance} />}
            {trade.upcomingCatalysts && <DetailRow label="Catalysts" value={trade.upcomingCatalysts} />}
          </CardContent>
        </Card>
      )}

      {/* Psychology */}
      {(trade.preMood != null ||
        trade.preConfidence != null ||
        trade.fomoFlag ||
        trade.revengeFlag ||
        trade.anxietyDuring != null ||
        trade.executionSatisfaction != null ||
        trade.tradeGrade ||
        trade.lessonsLearned) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Psychology</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {trade.preMood != null && (
                <DetailRow label="Pre-Trade Mood" value={`${trade.preMood}/10`} />
              )}
              {trade.preConfidence != null && (
                <DetailRow label="Confidence" value={`${trade.preConfidence}/10`} />
              )}
              {trade.fomoFlag && (
                <DetailRow
                  label="FOMO"
                  value={
                    <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                      Yes
                    </Badge>
                  }
                />
              )}
              {trade.revengeFlag && (
                <DetailRow
                  label="Revenge Trade"
                  value={
                    <Badge variant="outline" className="border-red-500/50 text-red-700 dark:text-red-400">
                      Yes
                    </Badge>
                  }
                />
              )}
              {trade.anxietyDuring != null && (
                <DetailRow label="Anxiety During" value={`${trade.anxietyDuring}/10`} />
              )}
              {trade.urgeToExitEarly && (
                <DetailRow label="Urge to Exit Early" value="Yes" />
              )}
              {trade.urgeToAdd && (
                <DetailRow label="Urge to Add" value="Yes" />
              )}
              {trade.executionSatisfaction != null && (
                <DetailRow
                  label="Execution Satisfaction"
                  value={`${trade.executionSatisfaction}/10`}
                />
              )}
              {trade.tradeGrade && (
                <DetailRow
                  label="Grade"
                  value={
                    <Badge
                      variant="outline"
                      className={cn(
                        trade.tradeGrade === 'A' && 'border-green-500/50 text-green-700 dark:text-green-400',
                        trade.tradeGrade === 'B' && 'border-blue-500/50 text-blue-700 dark:text-blue-400',
                        trade.tradeGrade === 'C' && 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400',
                        trade.tradeGrade === 'D' && 'border-orange-500/50 text-orange-700 dark:text-orange-400',
                        trade.tradeGrade === 'F' && 'border-red-500/50 text-red-700 dark:text-red-400'
                      )}
                    >
                      {trade.tradeGrade}
                    </Badge>
                  }
                />
              )}
            </div>
            {trade.lessonsLearned && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground mb-1">Lessons Learned</p>
                <p className="whitespace-pre-wrap text-sm">{trade.lessonsLearned}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {tradeTags.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {tradeTags.map((tt) => (
                <TagBadge
                  key={tt.id}
                  name={tt.tag.name}
                  category={tt.tag.category as TagCategory}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshots */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Screenshots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScreenshotGallery screenshots={screenshots} tradeId={trade.id} />
          <ScreenshotUpload tradeId={trade.id} />
        </CardContent>
      </Card>

      {/* Exit Legs Section */}
      <ExitLegsSection trade={trade} />

      {/* Notes */}
      {trade.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{trade.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 md:col-span-2">
        <LinkButton href={`/trades/${trade.id}/edit`}>Edit Trade</LinkButton>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button variant="destructive" />}>Delete Trade</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete trade?</DialogTitle>
              <DialogDescription>
                This will permanently delete the {trade.ticker} {trade.direction} trade. This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
