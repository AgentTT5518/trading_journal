'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateTrade } from '../services/actions';
import type { ActionState, TradeWithCalculations } from '../types';

/** Convert an ISO date string (or datetime-local string) to datetime-local input format */
function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 16);
}

const initialState: ActionState<{ id: string }> = { success: false };

const positionSizeLabel: Record<string, string> = {
  stock: 'Position Size (shares)',
  option: 'Position Size (shares per lot)',
  crypto: 'Quantity',
};

export function TradeEditForm({ trade }: { trade: TradeWithCalculations }) {
  const router = useRouter();
  const updateTradeWithId = updateTrade.bind(null, trade.id);
  const [state, formAction, isPending] = useActionState(updateTradeWithId, initialState);

  useEffect(() => {
    if (state.success && state.data) {
      toast.success('Trade updated successfully');
      router.push(`/trades/${state.data.id}`);
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, router]);

  const isOption = trade.assetClass === 'option';
  const isCrypto = trade.assetClass === 'crypto';
  const hasExitLegs = trade.exitLegs.length > 0;

  return (
    <form action={formAction}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trade Info */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="hidden" name="assetClass" value={trade.assetClass} />

            <div className="space-y-2">
              <Label>Asset Class</Label>
              <p className="text-sm font-medium capitalize">{trade.assetClass}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker</Label>
              <Input
                id="ticker"
                name="ticker"
                defaultValue={trade.ticker}
                className="uppercase"
              />
              {state.errors?.ticker && (
                <p className="text-sm text-destructive">{state.errors.ticker[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select name="direction" defaultValue={trade.direction}>
                <SelectTrigger id="direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type</Label>
              <Select name="orderType" defaultValue={trade.orderType ?? 'limit'}>
                <SelectTrigger id="orderType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop_limit">Stop Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryTrigger">Entry Trigger / Reason</Label>
              <Textarea
                id="entryTrigger"
                name="entryTrigger"
                defaultValue={trade.entryTrigger ?? ''}
                placeholder="Why did you enter this trade?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Entry */}
        <Card>
          <CardHeader>
            <CardTitle>Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Entry Date & Time</Label>
              <Input
                id="entryDate"
                name="entryDate"
                type="datetime-local"
                defaultValue={toDatetimeLocal(trade.entryDate)}
              />
              {state.errors?.entryDate && (
                <p className="text-sm text-destructive">{state.errors.entryDate[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryPrice">
                {isOption ? 'Premium Paid (per share)' : 'Entry Price'}
              </Label>
              <Input
                id="entryPrice"
                name="entryPrice"
                type="number"
                step="0.0001"
                defaultValue={trade.entryPrice}
              />
              {state.errors?.entryPrice && (
                <p className="text-sm text-destructive">{state.errors.entryPrice[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="positionSize">
                {positionSizeLabel[trade.assetClass] ?? 'Position Size'}
              </Label>
              <Input
                id="positionSize"
                name="positionSize"
                type="number"
                step={isCrypto ? '0.00001' : '1'}
                defaultValue={trade.positionSize}
              />
              {state.errors?.positionSize && (
                <p className="text-sm text-destructive">{state.errors.positionSize[0]}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Options section */}
        {isOption && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Options Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="optionType">Option Type</Label>
                  <Select name="optionType" defaultValue={trade.optionType ?? 'call'}>
                    <SelectTrigger id="optionType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="put">Put</SelectItem>
                    </SelectContent>
                  </Select>
                  {state.errors?.optionType && (
                    <p className="text-sm text-destructive">{state.errors.optionType[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strike">Strike Price</Label>
                  <Input
                    id="strike"
                    name="strike"
                    type="number"
                    step="0.5"
                    defaultValue={trade.strike ?? ''}
                  />
                  {state.errors?.strike && (
                    <p className="text-sm text-destructive">{state.errors.strike[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    name="expiry"
                    type="date"
                    defaultValue={trade.expiry ?? ''}
                  />
                  {state.errors?.expiry && (
                    <p className="text-sm text-destructive">{state.errors.expiry[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contracts">Contracts</Label>
                  <Input
                    id="contracts"
                    name="contracts"
                    type="number"
                    step="1"
                    defaultValue={trade.contracts ?? ''}
                  />
                  {state.errors?.contracts && (
                    <p className="text-sm text-destructive">{state.errors.contracts[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="contractMultiplier">Contract Multiplier</Label>
                  <Input
                    id="contractMultiplier"
                    name="contractMultiplier"
                    type="number"
                    step="1"
                    defaultValue={trade.contractMultiplier ?? 100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iv">IV at Entry</Label>
                  <Input
                    id="iv"
                    name="iv"
                    type="number"
                    step="0.01"
                    defaultValue={trade.iv ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ivRank">IV Rank (0–100)</Label>
                  <Input
                    id="ivRank"
                    name="ivRank"
                    type="number"
                    step="1"
                    defaultValue={trade.ivRank ?? ''}
                  />
                </div>
              </div>

              <details className="space-y-2" open={!!(trade.delta || trade.gamma || trade.theta || trade.vega)}>
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Greeks (optional)
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="delta">Delta</Label>
                    <Input id="delta" name="delta" type="number" step="0.01" defaultValue={trade.delta ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gamma">Gamma</Label>
                    <Input id="gamma" name="gamma" type="number" step="0.001" defaultValue={trade.gamma ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theta">Theta</Label>
                    <Input id="theta" name="theta" type="number" step="0.01" defaultValue={trade.theta ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vega">Vega</Label>
                    <Input id="vega" name="vega" type="number" step="0.01" defaultValue={trade.vega ?? ''} />
                  </div>
                </div>
              </details>

              <details className="space-y-2" open={!!(trade.spreadId)}>
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Spread Linking (optional)
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="spreadId">Spread ID</Label>
                    <Input id="spreadId" name="spreadId" defaultValue={trade.spreadId ?? ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spreadType">Spread Type</Label>
                    <Select name="spreadType" defaultValue={trade.spreadType ?? ''}>
                      <SelectTrigger id="spreadType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical">Vertical</SelectItem>
                        <SelectItem value="iron_condor">Iron Condor</SelectItem>
                        <SelectItem value="straddle">Straddle</SelectItem>
                        <SelectItem value="strangle">Strangle</SelectItem>
                        <SelectItem value="butterfly">Butterfly</SelectItem>
                        <SelectItem value="calendar">Calendar</SelectItem>
                        <SelectItem value="diagonal">Diagonal</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Crypto section */}
        {isCrypto && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Crypto Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="exchange">Exchange</Label>
                  <Input id="exchange" name="exchange" defaultValue={trade.exchange ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradingPair">Trading Pair</Label>
                  <Input id="tradingPair" name="tradingPair" defaultValue={trade.tradingPair ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leverage">Leverage (1 = spot)</Label>
                  <Input
                    id="leverage"
                    name="leverage"
                    type="number"
                    step="1"
                    min="1"
                    defaultValue={trade.leverage ?? ''}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="makerFee">Maker Fee ($)</Label>
                  <Input id="makerFee" name="makerFee" type="number" step="0.01" defaultValue={trade.makerFee ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="takerFee">Taker Fee ($)</Label>
                  <Input id="takerFee" name="takerFee" type="number" step="0.01" defaultValue={trade.takerFee ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="networkFee">Network Fee ($)</Label>
                  <Input id="networkFee" name="networkFee" type="number" step="0.01" defaultValue={trade.networkFee ?? ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fundingRate">Funding Rate</Label>
                  <Input id="fundingRate" name="fundingRate" type="number" step="0.0001" defaultValue={trade.fundingRate ?? ''} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="liquidationPrice">Liquidation Price</Label>
                  <Input
                    id="liquidationPrice"
                    name="liquidationPrice"
                    type="number"
                    step="0.01"
                    defaultValue={trade.liquidationPrice ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketCapCategory">Market Cap Category</Label>
                  <Select name="marketCapCategory" defaultValue={trade.marketCapCategory ?? ''}>
                    <SelectTrigger id="marketCapCategory">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="large">Large Cap</SelectItem>
                      <SelectItem value="mid">Mid Cap</SelectItem>
                      <SelectItem value="small">Small Cap</SelectItem>
                      <SelectItem value="micro">Micro Cap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exit */}
        <Card>
          <CardHeader>
            <CardTitle>Exit (leave blank to keep open)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasExitLegs ? (
              <p className="text-sm text-muted-foreground">
                This trade uses exit legs for tracking. Manage exits from the trade detail page.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="exitDate">Exit Date & Time</Label>
                  <Input
                    id="exitDate"
                    name="exitDate"
                    type="datetime-local"
                    defaultValue={toDatetimeLocal(trade.exitDate)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitPrice">
                    {isOption ? 'Exit Premium (per share)' : 'Exit Price'}
                  </Label>
                  <Input
                    id="exitPrice"
                    name="exitPrice"
                    type="number"
                    step="0.0001"
                    defaultValue={trade.exitPrice ?? ''}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitReason">Exit Reason</Label>
                  <Select name="exitReason" defaultValue={trade.exitReason ?? ''}>
                    <SelectTrigger id="exitReason">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="target_hit">Target Hit</SelectItem>
                      <SelectItem value="stop_hit">Stop Hit</SelectItem>
                      <SelectItem value="trailing_stop">Trailing Stop</SelectItem>
                      <SelectItem value="time_based">Time Based</SelectItem>
                      <SelectItem value="discretionary">Discretionary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fees & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Fees & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissions">Commissions</Label>
                <Input
                  id="commissions"
                  name="commissions"
                  type="number"
                  step="0.01"
                  defaultValue={trade.commissions ?? 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fees">Fees</Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  step="0.01"
                  defaultValue={trade.fees ?? 0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={trade.notes ?? ''}
                placeholder="Additional notes about this trade..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/trades/${trade.id}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
