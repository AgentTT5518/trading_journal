# Trading Journal App — Feature Research

> Target user: Solo swing trader | Markets: Stocks, Options, Crypto
> Goals: Performance improvement, risk management, psychology tracking, record-keeping
> Data entry: Manual only | Screenshots: Optional

---

## 1. Core Trade Data Fields

**Trade Identification:**
- Unique trade ID (auto-generated)
- Asset class (stock, option, crypto)
- Ticker / symbol / trading pair
- Trade direction (long / short)

**Entry Data:**
- Entry date and time
- Entry price
- Position size (shares, contracts, or units)
- Total position value (notional)
- Order type (market, limit, stop-limit)
- Entry trigger / reason

**Exit Data:**
- Exit date and time
- Exit price
- Partial exits support (scale-out tracking with multiple exit legs)
- Exit reason (target hit, stop hit, trailing stop, time-based, discretionary)

**Risk Parameters (Planned vs. Actual):**
- Planned stop-loss price
- Actual stop-loss price (if adjusted)
- Planned target price(s) — up to 3 targets
- Initial risk in dollars and % of account
- Risk-reward ratio (planned vs. actual)
- R-multiple achieved

**Financial Results:**
- Gross P&L (dollars)
- Commissions and fees
- Net P&L (dollars and percentage)
- Return on risk (R-multiple)
- Cumulative P&L (running total)

**Attachments:**
- Chart screenshots (optional)
- Notes / written rationale

---

## 2. Swing-Trading-Specific Fields

**Holding Period:**
- Planned holding duration (target days)
- Actual holding duration
- Held over weekend (yes/no)
- Held through earnings (yes/no)
- Held through macro events (FOMC, CPI, etc.)

**Multi-Day Trade Management:**
- Intra-trade adjustments log (stop moves, adds, partial exits)

**Market Context at Entry:**
- Weekly trend direction (up / down / sideways)
- Key support/resistance levels
- Sector / industry performance
- Market regime (SPY/QQQ trending vs. choppy)
- VIX level at entry
- Upcoming catalysts

**Technical Context:**
- Key indicator values at entry (RSI, MACD, MAs)
- Distance from key moving averages (50-day, 200-day)
- Volume profile (above/below average)
- ATR at entry

---

## 3. Options-Specific Fields

**Contract Details:**
- Underlying ticker
- Option type (call / put)
- Strike price, expiration date
- DTE at entry and exit
- Number of contracts
- Premium paid or received

**Multi-Leg / Spread Support:**
- Strategy type: vertical, iron condor, straddle, strangle, butterfly, calendar, covered call, cash-secured put, etc.
- Individual leg tracking
- Net debit or credit
- Max profit / max loss potential
- Breakeven price(s)

**Greeks at Entry:**
- Delta, Gamma, Theta, Vega

**Volatility Data:**
- IV of the contract at entry
- IV Rank / IV Percentile
- HV vs. IV comparison

**Options-Specific Outcomes:**
- Assignment / exercise tracking
- Rolled positions (chain of rolls)
- Theta decay captured vs. actual P&L

---

## 4. Crypto-Specific Fields

- Exchange name (Binance, Coinbase, Kraken, etc.)
- Trading pair (e.g., BTC/USDT)
- Trading fees (maker / taker)
- Network / gas fees
- Funding rate (for perpetual futures)
- Leverage used (if applicable)
- Liquidation price
- Market cap category (large/mid/small/micro)
- Token type (L1, L2, DeFi, meme, etc.)
- BTC dominance / correlation at entry

---

## 5. Risk Management Metrics

**Per-Trade:**
- Dollar risk per trade
- Risk as % of account equity
- R-multiple
- Risk-reward ratio (planned vs. actual)
- Position size as % of portfolio
- Stop-loss distance (price, %, ATR multiples)

**Portfolio-Level:**
- Maximum drawdown (dollars and %)
- Current drawdown from equity high
- Drawdown duration (days to recover)
- Max consecutive losses / wins
- Total open risk at any point
- Sector/asset concentration

**Rule Compliance Flags:**
- Position size violation
- Stop-loss adherence (honored or moved/removed?)
- Max daily/weekly loss hit
- Scaling rules followed

---

## 6. Psychology & Discipline Tracking

**Pre-Trade:**
- Mood rating (1-10 or categorical: calm, anxious, excited, frustrated, fearful, confident)
- Confidence in setup (1-10)
- FOMO present? (yes/no)
- Revenge trading? (yes/no)

**During Trade:**
- Anxiety level
- Urge to exit early or add impulsively
- Checking frequency (obsessive?)

**Post-Trade Reflection:**
- Execution satisfaction (1-10)
- Lessons learned (free text)
- Trade grade (A/B/C/D/F based on process, not P&L)
- "Was this a quality trade regardless of outcome?"

**Behavioral Tags:**
- Emotional: FOMO, REVENGE, HESITATION, OVERCONFIDENCE, IMPATIENCE, FEAR, GREED
- Execution: EARLY_ENTRY, LATE_ENTRY, EARLY_EXIT, LATE_EXIT, CHASED, OVERSIZE
- Discipline: FOLLOWED_PLAN, BROKE_RULES, MOVED_STOP, REMOVED_STOP

**Daily Contextual Factors:**
- Sleep quality/hours
- Stress level (1-10)
- Exercise / physical state
- Trading plan reviewed? (yes/no)
- Focus level (1-10)

**Quantified Psychology:**
- P&L grouped by emotional tag (cost-of-emotion audit)
- Win rate: plan-followed vs. plan-broken
- Performance correlation with mood, sleep, stress

---

## 7. Analytics & Dashboard

**Core Metrics:**
- Total net P&L (all time, monthly, weekly, daily)
- Win rate, loss rate
- Average winner / average loser (dollars and R)
- Largest winner / largest loser
- Profit factor (gross profit / gross loss)
- Expectancy (average R per trade)
- Payoff ratio (avg win / avg loss)

**Consistency:**
- Equity curve (cumulative P&L)
- Monthly / weekly return breakdown
- Best/worst day, week, month
- Win/loss streaks
- Recovery factor (net profit / max drawdown)

**Time-Based:**
- Performance by day of week
- Performance by holding duration
- Calendar heatmap of daily P&L

**Segmented Analysis (filter/pivot):**
- By asset class (stocks vs. options vs. crypto)
- By ticker/symbol
- By setup/strategy type
- By direction (long vs. short)
- By market condition tag
- By emotional state tag

**Visualizations:**
- Equity curve chart
- P&L calendar heatmap
- R-multiple distribution histogram
- Pie charts (win/loss, long/short, by strategy)
- Rolling metrics (win rate, expectancy over last N trades)

---

## 8. Review Features

**Daily Review:**
- Summary of all trades taken
- Total P&L
- Rules followed vs. broken
- Emotional state summary
- Day grade (A-F)

**Weekly Review:**
- Aggregated P&L and metrics
- Best/worst trades of the week
- Recurring patterns / mistakes
- Risk compliance score
- Goals for next week

**Monthly Review:**
- Monthly equity curve
- Strategy-by-strategy breakdown
- Psychology audit (cost of emotions)
- Progress toward goals
- Trading plan adjustments

---

## 9. Setup / Strategy Tagging

**Tag Groups:**
1. **Strategy/Setup:** breakout, pullback, mean reversion, trend continuation, range, gap fill, earnings play, catalyst, momentum, reversal, support/resistance bounce, MA bounce
2. **Market Condition:** trending up, trending down, range-bound, high volatility, low volatility, choppy, news-driven
3. **Timeframe:** 2-3 day swing, weekly swing, multi-week position
4. **Instrument-Specific:**
   - Stocks: large/mid/small cap, ETF, sector
   - Options: defined/undefined risk, directional, neutral, income, hedge
   - Crypto: BTC pair, stablecoin pair, DeFi, meme
5. **Execution Quality:** clean entry, chased, perfect exit, early/late exit
6. **Mistake Classification:** wrong sizing, ignored stop, no plan, counter-trend, overtraded, FOMO entry

**Tag Analytics:**
- P&L breakdown by any tag or combination
- Win rate and profit factor per tag
- Cross-tabulation (setup + market condition)

---

## 10. Playbook (Strategy Catalog)

Each strategy gets its own entry:
- Entry rules, exit rules, ideal market conditions
- Position sizing rules for the setup
- Example trades with screenshots
- Auto-calculated metrics: win rate, avg R, P&L, profit factor, expectancy
- Cross-analysis: which setups work best in which conditions

---

## Competitive Landscape

| Platform | Key Strengths | Price |
|---|---|---|
| TraderSync | AI coaching, 900+ broker imports, replay, 20+ dashboard widgets | $30-80/mo |
| Tradervue | 80+ brokers, 100+ reports, community sharing | Free-$50/mo |
| Edgewonk | Psychology (Tiltmeter), checklists, Edge Finder AI | $169/yr |
| TradeZella | Playbook system, 50+ reports, replay, mentor Spaces | $29-49/mo |
| TradesViz | 600+ stats, pivot grids, Greeks analysis, AI Q&A | Free-$25/mo |

**Key differentiators to target:** Psychology quantification, strategy-level breakdowns via tagging, swing-specific metrics (holding period optimization).
