'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import type { FormEvent } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { createTrade } from '../services/actions';
import { PositionSizeSimulator } from './position-size-simulator';
import { TagSelector } from '@/features/playbooks/components/tag-selector';
import type { Tag } from '@/features/playbooks/types';
import type { ActionState } from '../types';

const initialState: ActionState<{ id: string }> = { success: false };

type AssetClass = 'stock' | 'option' | 'crypto';

const positionSizeLabel: Record<AssetClass, string> = {
  stock: 'Position Size (shares)',
  option: 'Position Size (shares per lot)',
  crypto: 'Quantity',
};

interface TradeFormProps {
  tags: Tag[];
}

export function TradeForm({ tags }: TradeFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(createTrade, initialState);
  const [isPending, startTransition] = useTransition();
  const [assetClass, setAssetClass] = useState<AssetClass>('stock');

  // Prevent React 19's automatic form reset on every action call (including validation failures).
  // Using onSubmit + e.preventDefault() keeps uncontrolled input values intact when errors occur.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  useEffect(() => {
    if (state.success && state.data) {
      toast.success('Trade logged successfully');
      router.push(`/trades/${state.data.id}`);
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="trade">
        <TabsList>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        {/* ── Trade Tab ── */}
        <TabsContent value="trade" keepMounted>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Trade Info */}
            <Card>
              <CardHeader>
                <CardTitle>Trade Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input type="hidden" name="assetClass" value={assetClass} />

                <div className="space-y-2">
                  <Label htmlFor="assetClassSelect">Asset Class</Label>
                  <Select
                    name="_assetClass"
                    value={assetClass}
                    onValueChange={(v) => setAssetClass(v as AssetClass)}
                  >
                    <SelectTrigger id="assetClassSelect">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="option">Option</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticker">Ticker</Label>
                  <Input
                    id="ticker"
                    name="ticker"
                    placeholder={assetClass === 'crypto' ? 'BTC' : 'AAPL'}
                    className="uppercase"
                  />
                  {state.errors?.ticker && (
                    <p className="text-sm text-destructive">{state.errors.ticker[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Direction</Label>
                  <Select name="direction" defaultValue="long">
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
                  <Select name="orderType" defaultValue="limit">
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
                  <Input id="entryDate" name="entryDate" type="datetime-local" />
                  {state.errors?.entryDate && (
                    <p className="text-sm text-destructive">{state.errors.entryDate[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entryPrice">
                    {assetClass === 'option' ? 'Premium Paid (per share)' : 'Entry Price'}
                  </Label>
                  <Input
                    id="entryPrice"
                    name="entryPrice"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                  />
                  {state.errors?.entryPrice && (
                    <p className="text-sm text-destructive">
                      {state.errors.entryPrice[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="positionSize">{positionSizeLabel[assetClass]}</Label>
                  <Input
                    id="positionSize"
                    name="positionSize"
                    type="number"
                    step={assetClass === 'crypto' ? '0.00001' : '1'}
                    placeholder={assetClass === 'crypto' ? '0.5' : '100'}
                  />
                  {state.errors?.positionSize && (
                    <p className="text-sm text-destructive">
                      {state.errors.positionSize[0]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Risk Management */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Risk Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="plannedStopLoss">Stop Loss</Label>
                    <Input
                      id="plannedStopLoss"
                      name="plannedStopLoss"
                      type="number"
                      step="0.0001"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plannedTarget1">Target Take Profit</Label>
                    <Input
                      id="plannedTarget1"
                      name="plannedTarget1"
                      type="number"
                      step="0.0001"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invalidationLevel">Invalidation Level</Label>
                    <Input
                      id="invalidationLevel"
                      name="invalidationLevel"
                      type="number"
                      step="0.0001"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options section */}
            {assetClass === 'option' && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Options Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="optionType">Option Type</Label>
                      <Select name="optionType" defaultValue="call">
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
                      <Input id="strike" name="strike" type="number" step="0.5" placeholder="450" />
                      {state.errors?.strike && (
                        <p className="text-sm text-destructive">{state.errors.strike[0]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input id="expiry" name="expiry" type="date" />
                      {state.errors?.expiry && (
                        <p className="text-sm text-destructive">{state.errors.expiry[0]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contracts">Contracts</Label>
                      <Input id="contracts" name="contracts" type="number" step="1" placeholder="1" />
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
                        defaultValue="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iv">IV at Entry</Label>
                      <Input id="iv" name="iv" type="number" step="0.01" placeholder="0.25" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ivRank">IV Rank (0-100)</Label>
                      <Input id="ivRank" name="ivRank" type="number" step="1" placeholder="60" />
                    </div>
                  </div>

                  <details className="space-y-2">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                      Greeks (optional)
                    </summary>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor="delta">Delta</Label>
                        <Input id="delta" name="delta" type="number" step="0.01" placeholder="0.45" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gamma">Gamma</Label>
                        <Input id="gamma" name="gamma" type="number" step="0.001" placeholder="0.02" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="theta">Theta</Label>
                        <Input id="theta" name="theta" type="number" step="0.01" placeholder="-0.05" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vega">Vega</Label>
                        <Input id="vega" name="vega" type="number" step="0.01" placeholder="0.15" />
                      </div>
                    </div>
                  </details>

                  <details className="space-y-2">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                      Spread Linking (optional)
                    </summary>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="spreadId">Spread ID</Label>
                        <Input id="spreadId" name="spreadId" placeholder="Same ID links legs together" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="spreadType">Spread Type</Label>
                        <Select name="spreadType">
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
            {assetClass === 'crypto' && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Crypto Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="exchange">Exchange</Label>
                      <Input id="exchange" name="exchange" placeholder="Binance, Coinbase…" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tradingPair">Trading Pair</Label>
                      <Input id="tradingPair" name="tradingPair" placeholder="BTC/USDT" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leverage">Leverage (1 = spot)</Label>
                      <Input
                        id="leverage"
                        name="leverage"
                        type="number"
                        step="1"
                        min="1"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="makerFee">Maker Fee ($)</Label>
                      <Input id="makerFee" name="makerFee" type="number" step="0.01" defaultValue="" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="takerFee">Taker Fee ($)</Label>
                      <Input id="takerFee" name="takerFee" type="number" step="0.01" defaultValue="" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="networkFee">Network Fee ($)</Label>
                      <Input
                        id="networkFee"
                        name="networkFee"
                        type="number"
                        step="0.01"
                        defaultValue=""
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fundingRate">Funding Rate</Label>
                      <Input
                        id="fundingRate"
                        name="fundingRate"
                        type="number"
                        step="0.0001"
                        placeholder="0.0001"
                      />
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
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marketCapCategory">Market Cap Category</Label>
                      <Select name="marketCapCategory">
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
                <CardTitle>Exit (optional for open trades)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exitDate">Exit Date & Time</Label>
                  <Input id="exitDate" name="exitDate" type="datetime-local" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitPrice">
                    {assetClass === 'option' ? 'Exit Premium (per share)' : 'Exit Price'}
                  </Label>
                  <Input
                    id="exitPrice"
                    name="exitPrice"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitReason">Exit Reason</Label>
                  <Select name="exitReason">
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
                      defaultValue="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fees">Fees</Label>
                    <Input
                      id="fees"
                      name="fees"
                      type="number"
                      step="0.01"
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes about this trade..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Simulation Tab ── */}
        <TabsContent value="simulation">
          <PositionSizeSimulator />
        </TabsContent>

        {/* ── Context Tab ── */}
        <TabsContent value="context" keepMounted>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Swing Context */}
            <Card>
              <CardHeader>
                <CardTitle>Swing Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedHoldDays">Planned Hold (days)</Label>
                  <Input
                    id="plannedHoldDays"
                    name="plannedHoldDays"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="5"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="heldOverWeekend" name="heldOverWeekend" />
                  <Label htmlFor="heldOverWeekend">Held over weekend</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="heldThroughEarnings" name="heldThroughEarnings" />
                  <Label htmlFor="heldThroughEarnings">Held through earnings</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="heldThroughMacro" name="heldThroughMacro" />
                  <Label htmlFor="heldThroughMacro">Held through macro event</Label>
                </div>
              </CardContent>
            </Card>

            {/* Market Context */}
            <Card>
              <CardHeader>
                <CardTitle>Market Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weeklyTrend">Weekly Trend</Label>
                    <Select name="weeklyTrend">
                      <SelectTrigger id="weeklyTrend">
                        <SelectValue placeholder="Select trend" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">Up</SelectItem>
                        <SelectItem value="down">Down</SelectItem>
                        <SelectItem value="sideways">Sideways</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marketRegime">Market Regime</Label>
                    <Select name="marketRegime">
                      <SelectTrigger id="marketRegime">
                        <SelectValue placeholder="Select regime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trending">Trending</SelectItem>
                        <SelectItem value="choppy">Choppy</SelectItem>
                        <SelectItem value="high_vol">High Volatility</SelectItem>
                        <SelectItem value="low_vol">Low Volatility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="vixLevel">VIX Level</Label>
                    <Input id="vixLevel" name="vixLevel" type="number" step="0.1" placeholder="20.5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportLevel">Support ($)</Label>
                    <Input id="supportLevel" name="supportLevel" type="number" step="0.01" placeholder="145.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resistanceLevel">Resistance ($)</Label>
                    <Input id="resistanceLevel" name="resistanceLevel" type="number" step="0.01" placeholder="160.00" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectorPerformance">Sector Performance</Label>
                  <Textarea
                    id="sectorPerformance"
                    name="sectorPerformance"
                    placeholder="XLF up 2%, XLK down 1%..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upcomingCatalysts">Upcoming Catalysts</Label>
                  <Textarea
                    id="upcomingCatalysts"
                    name="upcomingCatalysts"
                    placeholder="FOMC meeting next week, earnings in 5 days..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Technical Indicators */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="rsiAtEntry">RSI at Entry (0-100)</Label>
                    <Input id="rsiAtEntry" name="rsiAtEntry" type="number" min="0" max="100" step="0.1" placeholder="55" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macdAtEntry">MACD at Entry</Label>
                    <Input id="macdAtEntry" name="macdAtEntry" placeholder="histogram: 0.5, signal: 12.3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volumeProfile">Volume Profile</Label>
                    <Select name="volumeProfile">
                      <SelectTrigger id="volumeProfile">
                        <SelectValue placeholder="Select volume" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above_avg">Above Average</SelectItem>
                        <SelectItem value="avg">Average</SelectItem>
                        <SelectItem value="below_avg">Below Average</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distanceFrom50ma">Distance from 50-MA ($)</Label>
                    <Input id="distanceFrom50ma" name="distanceFrom50ma" type="number" step="0.01" placeholder="2.50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distanceFrom200ma">Distance from 200-MA ($)</Label>
                    <Input id="distanceFrom200ma" name="distanceFrom200ma" type="number" step="0.01" placeholder="10.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="atrAtEntry">ATR at Entry</Label>
                    <Input id="atrAtEntry" name="atrAtEntry" type="number" min="0" step="0.01" placeholder="3.50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Psychology Tab ── */}
        <TabsContent value="psychology" keepMounted>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pre-Trade */}
            <Card>
              <CardHeader>
                <CardTitle>Pre-Trade Mindset</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preMood">Mood (1-10)</Label>
                  <Input
                    id="preMood"
                    name="preMood"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    placeholder="7"
                  />
                  {state.errors?.preMood && (
                    <p className="text-sm text-destructive">{state.errors.preMood[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preConfidence">Confidence in Setup (1-10)</Label>
                  <Input
                    id="preConfidence"
                    name="preConfidence"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    placeholder="8"
                  />
                  {state.errors?.preConfidence && (
                    <p className="text-sm text-destructive">{state.errors.preConfidence[0]}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="fomoFlag" name="fomoFlag" />
                  <Label htmlFor="fomoFlag">FOMO present</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="revengeFlag" name="revengeFlag" />
                  <Label htmlFor="revengeFlag">Revenge trade</Label>
                </div>
              </CardContent>
            </Card>

            {/* During Trade */}
            <Card>
              <CardHeader>
                <CardTitle>During Trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="anxietyDuring">Anxiety Level (1-10)</Label>
                  <Input
                    id="anxietyDuring"
                    name="anxietyDuring"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    placeholder="5"
                  />
                  {state.errors?.anxietyDuring && (
                    <p className="text-sm text-destructive">{state.errors.anxietyDuring[0]}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="urgeToExitEarly" name="urgeToExitEarly" />
                  <Label htmlFor="urgeToExitEarly">Urge to exit early</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="urgeToAdd" name="urgeToAdd" />
                  <Label htmlFor="urgeToAdd">Urge to add to position</Label>
                </div>
              </CardContent>
            </Card>

            {/* Post-Trade */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Post-Trade Reflection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="executionSatisfaction">Execution Satisfaction (1-10)</Label>
                    <Input
                      id="executionSatisfaction"
                      name="executionSatisfaction"
                      type="number"
                      min="1"
                      max="10"
                      step="1"
                      placeholder="7"
                    />
                    {state.errors?.executionSatisfaction && (
                      <p className="text-sm text-destructive">
                        {state.errors.executionSatisfaction[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tradeGrade">Trade Grade</Label>
                    <Select name="tradeGrade">
                      <SelectTrigger id="tradeGrade">
                        <SelectValue placeholder="Grade this trade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A — Excellent</SelectItem>
                        <SelectItem value="B">B — Good</SelectItem>
                        <SelectItem value="C">C — Average</SelectItem>
                        <SelectItem value="D">D — Poor</SelectItem>
                        <SelectItem value="F">F — Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonsLearned">Lessons Learned</Label>
                  <Textarea
                    id="lessonsLearned"
                    name="lessonsLearned"
                    placeholder="What did you learn from this trade?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* ── Tags Tab ── */}
        <TabsContent value="tags" keepMounted>
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagSelector tags={tags} selectedTagIds={[]} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Trade'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/trades')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
