# ATGE Trade Details Data Population Fix - Tasks

## Overview

This task list outlines the step-by-step implementation plan for fixing the Trade Details modal to display actual data instead of "N/A" and "Pending" placeholders.

## Current Status

**🚨 MAJOR SCOPE CHANGE** - This is now a comprehensive historical backtesting system!

**What's Working:**
- ✅ TradeSignal interface includes all required fields (indicators, snapshot, result data)
- ✅ Technical Indicators section displays all actual values (RSI, MACD, EMA, Bollinger Bands, ATR, Volume)
- ✅ Market Snapshot section displays price, volume, market cap, 24h high/low, and timestamp
- ✅ Data Source & Quality section exists and displays values

**What Needs to be Built:**
- 🔨 **Historical Price Data System** - Fetch and store OHLCV data from CoinGecko/CoinMarketCap
- 🔨 **Automated Backtesting Engine** - Calculate trade results based on historical data
- 🔨 **Background Job System** - Process trades asynchronously when user visits ATGE
- 🔨 **Social Sentiment Integration** - LunarCrush API for sentiment scores
- 🔨 **Whale Activity Tracking** - Blockchain.com API for whale transactions
- 🔨 **Fear & Greed Index** - CoinMarketCap/CoinGecko API integration
- 🔨 **Data Quality Validation** - Ensure accurate timeframe-based calculations

**Estimated Work:** ~8-12 hours (full backtesting system implementation)

---

## Task List

### 1. Update TradeSignal Interface

- [x] 1.1 Add `indicators` field to TradeSignal interface
  - ✅ COMPLETED: Interface already includes comprehensive `indicators` field with all technical indicator properties
  - _Requirements: 1.1-1.5_

- [x] 1.2 Add `snapshot` field to TradeSignal interface
  - ✅ COMPLETED: Interface already includes `snapshot` field with all market snapshot properties
  - _Requirements: 1.1-1.5_

- [x] 1.3 Add data source fields to `result` object
  - ✅ COMPLETED: Result object already includes `dataSource`, `dataResolution`, and `dataQualityScore` fields
  - _Requirements: 1.1-1.5, 4.1-4.6_

- [x] 1.4 Verify TypeScript compilation
  - ✅ COMPLETED: Interface is properly typed and compiles without errors
  - _Requirements: 1.1-1.5_

### 2. Update Technical Indicators Section in Modal

- [x] 2.1 Update RSI display
  - ✅ COMPLETED: RSI displays actual value with signal (overbought/oversold/neutral)
  - _Requirements: 2.1, 2.10_

- [x] 2.2 Update MACD display
  - ✅ COMPLETED: MACD displays actual value with signal (bullish/bearish/neutral)
  - _Requirements: 2.2, 2.10_

- [x] 2.3 Update EMA 20 display
  - ✅ COMPLETED: EMA 20 displays actual value formatted as currency
  - _Requirements: 2.3, 2.10_

- [x] 2.4 Update EMA 50 display
  - ✅ COMPLETED: EMA 50 displays actual value formatted as currency
  - _Requirements: 2.4, 2.10_

- [x] 2.5 Update EMA 200 display
  - ✅ COMPLETED: EMA 200 displays actual value formatted as currency
  - _Requirements: 2.5, 2.10_

- [x] 2.6 Add Bollinger Bands display
  - ✅ COMPLETED: Bollinger Bands section displays upper, middle, and lower bands
  - _Requirements: 2.6, 2.10_

- [x] 2.7 Add ATR display
  - ✅ COMPLETED: ATR displays actual value with "Volatility measure" label
  - _Requirements: 2.7, 2.10_

- [x] 2.8 Add 24h Volume display
  - ✅ COMPLETED: Volume displays from indicators.volumeAvg (formatted in millions)
  - _Requirements: 2.8, 2.10_

- [ ] 2.9 Verify Market Cap display in indicators
  - Check if `trade.indicators.marketCap` exists in API response
  - If not available in indicators, this data is shown in snapshot section
  - _Requirements: 2.9, 2.10_

- [x] 2.10 Add explanation text for missing data
  - ✅ COMPLETED: Conditional rendering shows explanation when indicators are missing
  - _Requirements: 2.10, 5.1-5.5_

### 3. Update Data Source & Quality Section

- [ ] 3.1 Update Data Source display
  - Current: Shows `{trade.result?.dataSource || 'CoinMarketCap'}` (has fallback)
  - Update to: `{trade.result?.dataSource || 'Pending'}` with explanation text
  - Add conditional text: "Backtesting in progress" when pending
  - _Requirements: 4.1, 4.4-4.5_

- [ ] 3.2 Update Data Resolution display
  - Current: Shows `{trade.result?.dataResolution || '1-minute intervals'}` (has fallback)
  - Update to: `{trade.result?.dataResolution || 'Pending'}` with explanation text
  - Add conditional text: "Backtesting in progress" when pending
  - _Requirements: 4.2, 4.4-4.5_

- [ ] 3.3 Update Quality Score display
  - Current: Shows quality score but needs quality rating labels
  - Add quality rating text: Excellent (≥90%), Good (≥70%), Fair (≥50%), Poor (<50%)
  - Add conditional rendering for when score is undefined
  - _Requirements: 4.3, 4.6_

### 4. Enhance Market Snapshot with Additional Data Sources

- [x] 4.1 Create Market Snapshot section
  - ✅ COMPLETED: Section exists with conditional rendering `{trade.snapshot && (...)}`
  - _Requirements: 3.1-3.9_

- [x] 4.2 Add Price at Generation display
  - ✅ COMPLETED: Displays `trade.snapshot.price` formatted as currency
  - _Requirements: 3.1_

- [x] 4.3 Add 24h Change display
  - ✅ COMPLETED: Displays `trade.snapshot.priceChange24h` with color coding
  - _Requirements: 3.2_

- [x] 4.4 Add 24h Volume display
  - ✅ COMPLETED: Displays `trade.snapshot.volume24h` formatted in billions
  - _Requirements: 3.3_

- [x] 4.5 Add Market Cap display
  - ✅ COMPLETED: Displays `trade.snapshot.marketCap` formatted in billions
  - _Requirements: 3.4_

- [x] 4.6 Add 24h High/Low display
  - ✅ COMPLETED: Displays `trade.snapshot.high24h` and `trade.snapshot.low24h`
  - _Requirements: 3.2_

- [x] 4.7 Add snapshot timestamp
  - ✅ COMPLETED: Displays `trade.snapshot.timestamp` as localized date/time
  - _Requirements: 3.8_

- [ ] 4.8 Integrate LunarCrush API for Social Sentiment
  - Create `/api/atge/social-sentiment/[symbol]` endpoint
  - Fetch social sentiment score from LunarCrush API
  - Store in `snapshot.socialSentimentScore` field
  - Display in Market Snapshot section
  - _Requirements: 3.5_
  - _API: LunarCrush_

- [ ] 4.9 Integrate Blockchain.com API for Whale Activity
  - Create `/api/atge/whale-activity/[symbol]` endpoint
  - Fetch large transaction count from Blockchain.com API
  - Store in `snapshot.whaleActivityCount` field
  - Display in Market Snapshot section
  - _Requirements: 3.6_
  - _API: Blockchain.com_

- [ ] 4.10 Integrate Fear & Greed Index
  - Create `/api/atge/fear-greed-index` endpoint
  - Fetch from CoinMarketCap or CoinGecko API
  - Store in `snapshot.fearGreedIndex` field
  - Display with sentiment label (Extreme Fear/Fear/Neutral/Greed/Extreme Greed)
  - _Requirements: 3.7_
  - _API: CoinMarketCap or CoinGecko_

### 5. Build Historical Price Data System

- [ ] 5.1 Create Supabase table for historical OHLCV data
  - Table: `atge_historical_prices`
  - Columns: `id`, `symbol`, `timestamp`, `open`, `high`, `low`, `close`, `volume`, `timeframe`, `data_source`, `created_at`
  - Indexes: `(symbol, timestamp, timeframe)`, `(symbol, timeframe)`
  - _Purpose: Store historical price data for backtesting_

- [ ] 5.2 Create Historical Price Fetcher API
  - File: `pages/api/atge/historical-prices/fetch.ts`
  - Fetch OHLCV data from CoinGecko or CoinMarketCap
  - Support multiple timeframes: 15m, 1h, 4h, 1d, 1w
  - Store in `atge_historical_prices` table
  - Handle pagination for large date ranges
  - _API: CoinGecko (primary), CoinMarketCap (fallback)_

- [ ] 5.3 Create Historical Price Query API
  - File: `pages/api/atge/historical-prices/query.ts`
  - Query historical prices by symbol, timeframe, and date range
  - Return OHLCV data for backtesting calculations
  - Implement caching to reduce database queries
  - _Purpose: Provide data for backtesting engine_

- [ ] 5.4 Implement Data Quality Validation
  - Validate completeness of historical data (no gaps)
  - Calculate data quality score (0-100%)
  - Flag missing or suspicious data points
  - Store quality score in trade result
  - _Purpose: Ensure accurate backtesting results_

### 6. Build Automated Backtesting Engine

- [ ] 6.1 Create Backtesting Engine Core
  - File: `lib/atge/backtestingEngine.ts`
  - Input: Trade signal (entry, TP1/2/3, SL, timeframe, generated timestamp)
  - Output: Trade result (which targets hit, when, at what price, P/L)
  - Logic: Iterate through historical prices to find target hits
  - _Purpose: Calculate actual trade outcomes_

- [ ] 6.2 Implement Target Hit Detection
  - Check if price reached TP1, TP2, TP3 levels
  - Check if price hit stop loss
  - Record exact timestamp and price of each hit
  - Respect timeframe constraints (trade expires after timeframe)
  - _Purpose: Determine which targets were hit_

- [ ] 6.3 Calculate Profit/Loss
  - Calculate P/L for each target hit (weighted by allocation)
  - Calculate net P/L (sum of all targets minus losses)
  - Calculate P/L percentage
  - Calculate trade duration in minutes
  - _Purpose: Provide accurate financial results_

- [ ] 6.4 Handle Edge Cases
  - Trade expires before any target hit
  - Stop loss hit before any TP
  - Multiple targets hit in sequence
  - Insufficient historical data (incomplete_data status)
  - _Purpose: Robust error handling_

### 7. Build Background Job System

- [ ] 7.1 Create Trade Processing Queue
  - Table: `atge_backtest_queue`
  - Columns: `id`, `trade_id`, `status`, `priority`, `attempts`, `error_message`, `created_at`, `processed_at`
  - Status: `pending`, `processing`, `completed`, `failed`
  - _Purpose: Queue trades for backtesting_

- [ ] 7.2 Create Background Worker API
  - File: `pages/api/atge/backtest/process.ts`
  - Fetch pending trades from queue
  - Run backtesting engine for each trade
  - Update trade result in database
  - Mark queue item as completed
  - _Purpose: Process trades asynchronously_

- [ ] 7.3 Implement Auto-Trigger on ATGE Visit
  - Hook: When user visits ATGE section
  - Check for trades with status `active` or `incomplete_data`
  - Add to backtest queue if not already queued
  - Start background processing
  - _Purpose: Automatic backtesting on user visit_

- [ ] 7.4 Add Progress Tracking
  - Real-time status updates for backtesting progress
  - Show "Backtesting in progress..." in UI
  - Display progress percentage (e.g., "Processing 3/10 trades")
  - Auto-refresh when backtesting completes
  - _Purpose: User feedback during processing_

### 8. Testing and Validation

- [ ] 8.1 Test Historical Price Data Fetching
  - Fetch 1 week of 15m candles for BTC
  - Verify data is stored in `atge_historical_prices` table
  - Verify no gaps in data
  - Calculate and verify data quality score
  - _Requirements: 5.1-5.4_

- [ ] 8.2 Test Backtesting Engine with Known Trade
  - Create test trade with known entry/TP/SL
  - Run backtesting engine with historical data
  - Verify correct targets are detected as hit
  - Verify P/L calculations are accurate
  - _Requirements: 6.1-6.4_

- [ ] 8.3 Test Background Job System
  - Generate 5 test trades
  - Visit ATGE section to trigger auto-processing
  - Verify trades are added to queue
  - Verify background worker processes trades
  - Verify trade results are updated in database
  - _Requirements: 7.1-7.4_

- [ ] 8.4 Test with Multiple Timeframes
  - Generate trades for 15m, 1h, 4h, 1d, 1w
  - Verify backtesting respects timeframe constraints
  - Verify trades expire correctly after timeframe
  - _Requirements: 6.1-6.4_

- [ ] 8.5 Test Edge Cases
  - Trade with no targets hit (expired)
  - Trade with stop loss hit immediately
  - Trade with all 3 TPs hit
  - Trade with insufficient historical data
  - _Requirements: 6.4_

- [ ] 8.6 Test UI Display
  - Generate trade and wait for backtesting
  - Open Trade Details modal
  - Verify all data displays correctly
  - Verify "Pending" shows during backtesting
  - Verify actual results show after completion
  - _Requirements: All_

- [ ] 8.7 Verify TypeScript compilation
  - Run `npm run type-check` or `npm run build`
  - Verify no TypeScript errors
  - _Requirements: All_

- [ ] 8.8 Verify no runtime errors
  - Check browser console for errors
  - Check server logs for errors
  - Test all edge cases
  - _Requirements: All_

### 9. Deployment

- [ ] 9.1 Create database migrations
  - Migration: Create `atge_historical_prices` table
  - Migration: Create `atge_backtest_queue` table
  - Migration: Add indexes for performance
  - Run migrations on production database
  - _Requirements: 5.1, 7.1_

- [ ] 9.2 Deploy Phase 1: Historical Price System
  - Commit historical price fetcher and query APIs
  - Deploy to production
  - Test historical price fetching in production
  - Verify data is stored correctly
  - _Requirements: 5.1-5.4_

- [ ] 9.3 Deploy Phase 2: Backtesting Engine
  - Commit backtesting engine and background worker
  - Deploy to production
  - Test backtesting with 1-2 trades
  - Verify results are accurate
  - _Requirements: 6.1-6.4_

- [ ] 9.4 Deploy Phase 3: Auto-Trigger System
  - Commit auto-trigger on ATGE visit
  - Deploy to production
  - Test with real user flow
  - Verify trades are processed automatically
  - _Requirements: 7.1-7.4_

- [ ] 9.5 Deploy Phase 4: Additional Data Sources
  - Commit LunarCrush, Blockchain.com, Fear & Greed APIs
  - Deploy to production
  - Test social sentiment, whale activity, fear & greed display
  - _Requirements: 4.8-4.10_

- [ ] 9.6 Deploy Phase 5: UI Updates
  - Commit UI changes (Pending display, quality ratings)
  - Deploy to production
  - Test complete user flow
  - _Requirements: 3.1-3.3_

- [ ] 9.7 Monitor production
  - Monitor error logs for 24 hours
  - Check database performance
  - Verify background jobs are running
  - Monitor API rate limits
  - _Requirements: All_

- [ ] 9.8 Final production test
  - Generate 10 test trades across different symbols and timeframes
  - Wait for backtesting to complete
  - Verify all results are accurate
  - Verify UI displays correctly
  - _Requirements: All_

---

## Task Dependencies

```
1.1 → 1.2 → 1.3 → 1.4
  ↓
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8 → 2.9 → 2.10
  ↓
3.1 → 3.2 → 3.3
  ↓
4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 (Optional)
  ↓
5.1 → 5.2 → 5.3 → 5.4 → 5.5
  ↓
6.1 → 6.2 → 6.3 → 6.4
```

---

## Estimated Timeline

- **Phase 1 (Interface Update)**: ✅ COMPLETE
  - Tasks 1.1-1.4

- **Phase 2 (Technical Indicators)**: ✅ COMPLETE
  - Tasks 2.1-2.10

- **Phase 3 (Data Source & Quality UI)**: 30 minutes
  - Tasks 3.1-3.3

- **Phase 4 (Additional Data Sources)**: 2-3 hours
  - Tasks 4.8-4.10 (LunarCrush, Blockchain.com, Fear & Greed)

- **Phase 5 (Historical Price System)**: 3-4 hours
  - Tasks 5.1-5.4 (Database, API, Validation)

- **Phase 6 (Backtesting Engine)**: 3-4 hours
  - Tasks 6.1-6.4 (Core engine, Target detection, P/L calculation)

- **Phase 7 (Background Job System)**: 2-3 hours
  - Tasks 7.1-7.4 (Queue, Worker, Auto-trigger, Progress)

- **Phase 8 (Testing)**: 2-3 hours
  - Tasks 8.1-8.8 (Comprehensive testing)

- **Phase 9 (Deployment)**: 2-3 hours
  - Tasks 9.1-9.8 (Phased deployment and monitoring)

**Total Time**: 
- **Quick Fix (Phase 3 only)**: 30 minutes
- **Full System (All Phases)**: 15-20 hours (2-3 days of focused work)

---

## Success Criteria

- [ ] TradeSignal interface includes `indicators` and `snapshot` fields
- [ ] Technical indicators display actual values (RSI, MACD, EMA, etc.)
- [ ] Data source and quality display actual values
- [ ] "N/A" only shown when data is truly unavailable
- [ ] "Pending" only shown for active trades not yet backtested
- [ ] No TypeScript errors
- [ ] No runtime errors or crashes
- [ ] All data displays correctly in production
- [ ] User can see complete trade information in modal

---

## Code Snippets

### TradeSignal Interface Update

```typescript
export interface TradeSignal {
  // ... existing fields
  
  result?: {
    // ... existing result fields
    dataSource: string;
    dataResolution: string;
    dataQualityScore: number;
  };
  
  indicators?: {
    rsiValue?: number;
    macdValue?: number;
    macdSignal?: number;
    macdHistogram?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
    bollingerUpper?: number;
    bollingerMiddle?: number;
    bollingerLower?: number;
    atrValue?: number;
    volume24h?: number;
    marketCap?: number;
  };
  
  snapshot?: {
    currentPrice: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
    socialSentimentScore?: number;
    whaleActivityCount?: number;
    fearGreedIndex?: number;
    snapshotAt: Date;
  };
}
```

### RSI Display Example

```typescript
<div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
    RSI (14)
  </p>
  <p className="text-2xl font-bold text-bitcoin-white font-mono">
    {trade.indicators?.rsiValue !== undefined 
      ? trade.indicators.rsiValue.toFixed(2)
      : 'N/A'}
  </p>
  {trade.indicators?.rsiValue !== undefined && (
    <p className="text-xs text-bitcoin-white-60 mt-1">
      {trade.indicators.rsiValue > 70 ? 'Overbought' : 
       trade.indicators.rsiValue < 30 ? 'Oversold' : 'Neutral'}
    </p>
  )}
</div>
```

### Data Source Display Example

```typescript
<div className="bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-lg p-4">
  <p className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider mb-2">
    Data Source
  </p>
  <p className="text-bitcoin-white font-bold">
    {trade.result?.dataSource || 'Pending'}
  </p>
  {!trade.result?.dataSource && (
    <p className="text-xs text-bitcoin-white-60 mt-1">
      Backtesting in progress
    </p>
  )}
</div>
```

---

## Notes

- All tasks should be completed in order unless otherwise specified
- Test each section after implementation before moving to the next
- The Market Snapshot section (Task 4) is optional but recommended
- Document any issues or unexpected behavior
- Keep stakeholders informed of progress

---

## Rollback Plan

If issues are encountered:

1. **Immediate**: Revert the commit: `git revert HEAD`
2. **Push**: `git push origin main`
3. **Verify**: Check that production is back to previous state
4. **Investigate**: Review error logs and identify the issue
5. **Fix**: Address the issue in development environment
6. **Redeploy**: Once fixed, commit and push again
