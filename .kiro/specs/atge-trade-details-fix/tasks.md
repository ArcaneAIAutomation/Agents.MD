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

#### Task 3.1: Update Data Source Display
**Status:** ✅ Complete  
**Estimated Time:** 10 minutes  
**Priority:** High  
**Dependencies:** None

**Description:**
Update the Data Source display in TradeDetailModal to show "Pending" instead of fallback value "CoinMarketCap" when backtesting hasn't completed yet.

**Files to Modify:**
- `components/ATGE/TradeDetailModal.tsx` (around line 640)

**Implementation Steps:**
1. Locate the Data Source display section
2. Change `{trade.result?.dataSource || 'CoinMarketCap'}` to `{trade.result?.dataSource || 'Pending'}`
3. Add conditional text below: "Backtesting in progress" when pending
4. Test with active trade (no result yet)

**Acceptance Criteria:**
- [x] Shows actual data source when available

- [x] Shows "Pending" when `trade.result?.dataSource` is undefined
-

- [x] Shows explanation text "Backtesting in progress" when pending




-

- [x] No TypeScript errors





- [x] No TypeScript errors

**Requirements:** 4.1, 4.4-4.5

---

#### Task 3.2: Update Data Resolution Display
**Status:** ✅ Complete  
**Estimated Time:** 10 minutes  
**Priority:** High  
**Dependencies:** None

**Description:**
Update the Data Resolution display to show "Pending" instead of fallback value "1-minute intervals" when backtesting hasn't completed yet.

**Files to Modify:**
- `components/ATGE/TradeDetailModal.tsx` (around line 650)

**Implementation Steps:**
1. Locate the Data Resolution display section
2. Change `{trade.result?.dataResolution || '1-minute intervals'}` to `{trade.result?.dataResolution || 'Pending'}`
3. Add conditional text below: "Backtesting in progress" when pending
4. Test with active trade (no result yet)

**Acceptance Criteria:**
- [x] Shows actual data resolution when available


- [x] Shows "Pending" when `trade.result?.dataResolution` is undefined


- [x] Shows explanation text "Backtesting in progress" when pending
- [x] No TypeScript errors

**Requirements:** 4.2, 4.4-4.5

---

#### Task 3.3: Add Quality Score Rating Labels
**Status:** ✅ Complete  
**Estimated Time:** 10 minutes  
**Priority:** Medium  
**Dependencies:** None

**Description:**
Add quality rating labels (Excellent/Good/Fair/Poor) to the Quality Score display based on the percentage value.

**Files to Modify:**
- `components/ATGE/TradeDetailModal.tsx` (around line 660)

**Implementation Steps:**
1. Locate the Quality Score display section
2. Add conditional rendering for rating label:
   - ≥90%: "Excellent"
   - ≥70%: "Good"
   - ≥50%: "Fair"
   - <50%: "Poor"
3. Display label below the percentage
4. Add conditional rendering for when score is undefined

**Acceptance Criteria:**
- [x] Shows quality score percentage when available



- [x] Shows appropriate rating label based on score




- [x] Shows "N/A" when score is undefined




- [x] Rating labels are color-coded (orange for good, white for fair/poor)




**Requirements:** 4.3, 4.6

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

#### Task 4.8: Integrate LunarCrush API for Social Sentiment
**Status:** 🔴 Not Started  
**Estimated Time:** 1 hour  
**Priority:** Medium  
**Dependencies:** None

**Description:**
Integrate LunarCrush API to fetch social sentiment scores and display them in the Market Snapshot section.

**Files to Create:**
- `pages/api/atge/social-sentiment/[symbol].ts`

**Files to Modify:**
- `components/ATGE/TradeDetailModal.tsx` (Market Snapshot section)

**Implementation Steps:**
1. Create API endpoint `/api/atge/social-sentiment/[symbol]`
2. Fetch social sentiment score from LunarCrush API
3. Return score (0-100) and metadata
4. Update TradeSignal interface if needed
5. Add display card in Market Snapshot section
6. Test with BTC and ETH

**Acceptance Criteria:**
- [x] API endpoint returns social sentiment score




- [x] Score is displayed in Market Snapshot section








- [x] Shows "N/A" when data is unavailable





- [x] LunarCrush API key is configured


-

-

- [x] Error handling for API failures





**Requirements:** 3.5  
**API:** LunarCrush

---

#### Task 4.9: Integrate Blockchain.com API for Whale Activity
**Status:** 🔴 Not Started  
**Estimated Time:** 1 hour  
**Priority:** Medium  
**Dependencies:** None

**Description:**
Integrate Blockchain.com API to track large Bitcoin transactions (whale activity) and display count in Market Snapshot.

**Files to Create:**
- `pages/api/atge/whale-activity/[symbol].ts`

**Files to Modify:**
- `components/ATGE/TradeDetailModal.tsx` (Market Snapshot section)

**Implementation Steps:**
1. Create API endpoint `/api/atge/whale-activity/[symbol]`
2. Fetch large transactions (>50 BTC) from Blockchain.com API
3. Count transactions in last 24 hours
4. Return whale transaction count
5. Add display card in Market Snapshot section
6. Test with BTC

**A-ceptance Criteria:**

- [x] API endpoint returns whale transaction count



- [x] Count is displayed in Market Snapshot section



- [x] Shows "N/A" when data is unavailable
- [x] Blockchain.com API key is configured
- [x] Error handling for API failures

**Requirements:** 3.6  
**API:** Blockchain.com

---

#### Task 4.10: Integrate Fear & Greed Index
**Status:** 🔴 Not Started  
**Estimated Time:** 1 hour  
**Priority:** Medium  
**Dependencies:** None

**Description:**
Integrate CoinMarketCap or CoinGecko API to fetch the Fear & Greed Index and display with sentiment labels.

**Files to Create:**
- `pages/api/atge/fear-greed-index.ts`

**Files to Modify:**
- `components/ATGE/TradeDetailModal.tsx` (Market Snapshot section)

**Implementation Steps:**
1. Create API endpoint `/api/atge/fear-greed-index`
2. Fetch Fear & Greed Index from CoinMarketCap or CoinGecko
3. Return index value (0-100) and classification
4. Add display card in Market Snapshot section
5. Add sentiment labels:
   - 0-24: Extreme Fear
   - 25-44: Fear
   - 45-55: Neutral
   - 56-75: Greed
   - 76-100: Extreme Greed
6. Test display

**Acceptance Criteria:**
- [x] API endpoint returns Fear & Greed Index




- [x] Index is displayed with appropriate sentiment label




- [x] Label is color-coded (red for fear, orange for greed)


- [x] Shows "N/A" when data is unavailable
- [x] Error handling for API failures

**Requirements:** 3.7  
**API:** CoinMarketCap or CoinGecko

### 5. Build Historical Price Data System

#### Task 5.1: Create Supabase Table for Historical OHLCV Data
**Status:** 🔴 Not Started  
**Estimated Time:** 30 minutes  
**Priority:** Critical  
**Dependencies:** None

**Description:**
Create a Supabase database table to store historical OHLCV (Open, High, Low, Close, Volume) price data for backtesting.

**Files to Create:**
- `migrations/005_create_atge_historical_prices.sql`

**Implementation Steps:**
1. Create migration file with table schema
2. Add columns: `id`, `symbol`, `timestamp`, `open`, `high`, `low`, `close`, `volume`, `timeframe`, `data_source`, `created_at`
3. Create indexes for fast lookups:
   - `(symbol, timestamp, timeframe)` - Primary lookup
   - `(symbol, timeframe)` - Symbol-specific queries
4. Run migration on development database
5. Verify table structure

**SQL Schema:**
```sql
CREATE TABLE atge_historical_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(10) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  data_source VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historical_prices_lookup ON atge_historical_prices(symbol, timestamp, timeframe);
CREATE INDEX idx_historical_prices_symbol_timeframe ON atge_historical_prices(symbol, timeframe);
```

**Acceptance Criteria:**
- [x] Table `atge_historical_prices` exists in database






- [x] All columns are properly typed




- [x] Indexes are created for performance










- [x] Migration runs without errors

- [x] Can insert and query test data

**Purpose:** Store historical price data for backtesting

---

#### Task 5.2: Create Historical Price Fetcher API
**Status:** 🔴 Not Started  
**Estimated Time:** 2 hours  
**Priority:** Critical  
**Dependencies:** Task 5.1

**Description:**
Create an API endpoint to fetch historical OHLCV data from CoinGecko or CoinMarketCap and store it in the database.

**Files to Create:**
- `pages/api/atge/historical-prices/fetch.ts`
- `lib/atge/historicalPriceFetcher.ts`

**Implementation Steps:**
1. Create API endpoint `/api/atge/historical-prices/fetch`
2. Accept parameters: `symbol`, `startDate`, `endDate`, `timeframe`
3. Fetch OHLCV data from CoinGecko API (primary)
4. Implement fallback to CoinMarketCap if CoinGecko fails
5. Support timeframes: 15m, 1h, 4h, 1d, 1w
6. Handle pagination for large date ranges
7. Store data in `atge_historical_prices` table


8. Avoid duplicate entries (check existing data first)












9. Return summary: `{ fetched: 1000, stored: 950, duplicates: 50 }`


**API Endpoints:**
- CoinGecko: `/coins/{id}/market_chart/range`
- CoinMarketCap: `/v1/cryptocurrency/ohlcv/historical`

**Acceptance Criteria:**
- [x] API endpoint accepts required parameters ✅ VERIFIED (Jan 27, 2025)
  - Validates all 4 required parameters (symbol, startDate, endDate, timeframe)
  - Proper error messages for invalid parameters
  - See: TASK-5.2-PARAMETER-VALIDATION-COMPLETE.md

- [x] Fetches data from CoinGecko successfully
- [x] Falls back to CoinMarketCap on failure







- [x] Stores data in database without duplicates


-

- [x] Handles pagination for large ranges






- [x] Returns accurate summary of operation


- [x] Error handling for API failures

- [x] Rate limiting respected ✅ VERIFIED (Jan 27, 2025)

  - Request queue system processes requests sequentially
  - Maximum 10 requests per minute (conservative limit)
  - 6-second minimum interval between requests
  - Exponential backoff for 429 rate limit errors
  - 2-second delay between pagination chunks
  - 24-hour caching reduces API calls
  - See: TASK-5.2-RATE-LIMITING-VERIFICATION.md

**API:** CoinGecko (primary), CoinMarketCap (fallback)

---

#### Task 5.3: Create Historical Price Query API
**Status:** ✅ Complete  
**Estimated Time:** 1 hour  
**Priority:** Critical  
**Dependencies:** Task 5.1, 5.2

**Description:**
Create an API endpoint to query historical prices from the database for backtesting calculations.

**Files to Create:**
- `pages/api/atge/historical-prices/query.ts` ✅
- `lib/atge/historicalPriceQuery.ts` ✅

**Implementation Steps:**
1. Create API endpoint `/api/atge/historical-prices/query` ✅
2. Accept parameters: `symbol`, `startDate`, `endDate`, `timeframe` ✅
3. Query database for matching OHLCV data ✅
4. Return data sorted by timestamp ascending ✅
5. Implement caching (5-minute TTL) to reduce database load ✅
6. Return data in format ready for backtesting engine ✅
7. Handle missing data gracefully ✅














**Response Format:**

```typescript
{
  symbol: 'BTC',
  timeframe: '15m',
  data: [
    {
      timestamp: '2025-01-01T00:00:00Z',
      open: 95000,
      high: 95500,
      low: 94800,
      close: 95200,
      volume: 1234567
    },
    // ... more candles
  ],
  dataQuality: 98.5,
  gaps: []
}
```

**Acceptance Criteria:**
- [x] API endpoint returns historical price data

- [x] Data is sorted by timestamp

- [x] Caching reduces database queries
- [x] Returns data quality score
- [x] Identifies gaps in data



- [x] Fast response time (<500ms for 1000 candles)
- [x] Error handling for missing data

**Purpose:** Provide data for backtesting engine

---

#### Task 5.4: Implement Data Quality Validation
**Status:** 🔴 Not Started  
**Estimated Time:** 1.5 hours  
**Priority:** High  
**Dependencies:** Task 5.3

**Description:**
Implement data quality validation to ensure historical data is complete and accurate for backtesting.

**Files to Create:**
- `lib/atge/dataQualityValidator.ts`

**Files to Modify:**
- `lib/atge/historicalPriceQuery.ts` (add validation)

**Implementation Steps:**
1. Create data quality validator function
2. Check for gaps in timestamp sequence
3. Validate OHLC relationships (high ≥ open/close, low ≤ open/close)
4. Check for suspicious price movements (>50% in one candle)
5. Calculate completeness percentage
6. Calculate data quality score (0-100%):
   - 100%: No gaps, all data valid
   - 90-99%: Minor gaps (<5%)
   - 70-89%: Some gaps (5-15%)
   - <70%: Significant gaps (>15%)
7. Return detailed quality report

**Quality Score Calculation:**
```typescript
dataQuality = (
  completeness * 0.6 +
  validityScore * 0.3 +
  consistencyScore * 0.1
) * 100
```

**Acceptance Criteria:**

- [x] Detects gaps in data




- [x] Validates OHLC relationships







- [x] Flags suspicious price movements
- [x] Calculates accurate quality score






- [x] Returns detailed quality report
- [x] Quality score stored in trade result


**Purpose:** Ensure accurate backtesting results

### 6. Build Automated Backtesting Engine

#### Task 6.1: Create Backtesting Engine Core
**Status:** 🔴 Not Started  
**Estimated Time:** 2 hours  
**Priority:** Critical  
**Dependencies:** Task 5.3, 5.4

**Description:**
Create the core backtesting engine that calculates actual trade outcomes based on historical price data.

**Files to Create:**
- `lib/atge/backtestingEngine.ts`

**Implementation Steps:**
1. Create `runBacktest()` function
2. Accept input: Trade signal with entry, TP1/2/3, SL, timeframe, generated timestamp
3. Fetch historical prices for the trade timeframe
4. Validate data quality (minimum 70%)
5. Iterate through historical prices chronologically
6. Detect target hits (TP1/2/3, SL)
7. Calculate P/L for each target
8. Return complete trade result
9. Handle edge cases (expired, insufficient data)

**Input Interface:**
```typescript
interface BacktestInput {
  tradeId: string;
  symbol: string;
  entryPrice: number;
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;





  tp3Price: number;
  tp3Allocation: number;
  stopLossPrice: number;
  timeframe: string;












  timeframeHours: number;
  generatedAt: Date;
}
```

**Output Interface:**
```typescript
interface BacktestResult {
  actualEntryPrice: number;
  tp1Hit: boolean;
  tp1HitAt?: Date;
  tp1HitPrice?: number;
  tp2Hit: boolean;
  tp2HitAt?: Date;
  tp2HitPrice?: number;
  tp3Hit: boolean;
  tp3HitAt?: Date;
  tp3HitPrice?: number;
  stopLossHit: boolean;
  stopLossHitAt?: Date;
  stopLossHitPrice?: number;
  profitLossUsd: number;
  profitLossPercentage: number;
  tradeDurationMinutes: number;
  netProfitLossUsd: number;
  dataSource: string;
  dataResolution: string;
  dataQualityScore: number;
}
```


**Acceptance Criteria:**
- [x] Function accepts trade signal input








-


- [x] Fetches historical prices for timeframe













-



--



- [x] Validates data quality (≥70%)
- [x] Iterates through prices chronologically
- [x] Returns complete trade result

- [x] Handles all edge cases




- [x] TypeScript types are correct


-

- [x] Unit tests pass


**Purpose:** Calculate actual trade outcomes

---

#### Task 6.2: Implement Target Hit Detection
**Status:** 🔴 Not Started  
**Estimated Time:** 1.5 hours  
**Priority:** Critical  
**Dependencies:** Task 6.1

**Description:**
Implement logic to detect when price reaches TP1/2/3 levels or stop loss, respecting timeframe constraints.

**Files to Modify:**
- `lib/atge/backtestingEngine.ts`




**Implementation Steps:**
1. Iterate through historical candles

















2. Check stop loss FIRST (highest priority)
3. If SL hit, trade ends immediately
4. Check TP1, then TP2, then TP3 in sequence
5. Record exact timestamp and price of each hit
6. Reduce remaining allocation after each TP hit
7. Respect timeframe: trade expires after timeframeHours
8. Handle partial fills (some TPs hit, others not)

**Detection Logic:**
```typescript
for (const candle of historicalPrices) {
  // Stop loss check (highest priority)
  if (candle.low <= stopLossPrice && !stopLossHit) {
    stopLossHit = true;
    stopLossHitAt = candle.timestamp;
    stopLossHitPrice = stopLossPrice;
    break; // Trade ends
  }
  
  // TP1 check
  if (candle.high >= tp1Price && !tp1Hit) {
    tp1Hit = true;
    tp1HitAt = candle.timestamp;
    tp1HitPrice = tp1Price;
    remainingAllocation -= tp1Allocation;
  }
  
  // TP2 check
  if (candle.high >= tp2Price && !tp2Hit) {
    tp2Hit = true;
    tp2HitAt = candle.timestamp;
    tp2HitPrice = tp2Price;
    remainingAllocation -= tp2Allocation;
  }
  
  // TP3 check
  if (candle.high >= tp3Price && !tp3Hit) {
    tp3Hit = true;
    tp3HitAt = candle.timestamp;
    tp3HitPrice = tp3Price;
    remainingAllocation -= tp3Allocation;
    break; // All targets hit
  }
  
  // Check if trade expired
  if (candle.timestamp > expiryTime) {
    break;
  }
}
```

**Acceptance Criteria:**
- [x] Stop loss checked first (highest priority)

















- [x] TPs checked in sequence (1, 2, 3)









- [x] Exact timestamp and price recorded

- [x] Remaining allocation tracked correctly





-

- [x] Trade expires after timeframe





- [x] Handles partial fills correctly


- [x] Unit tests for all scenarios


**Purpose:** Determine which targets were hit

---

#### Task 6.3: Calculate Profit/Loss
**Status:** 🔴 Not Started  
**Estimated Time:** 1 hour  
**Priority:** Critical  
**Dependencies:** Task 6.2

**Description:**
Calculate accurate profit/loss for the trade based on which targets were hit and their allocations.

**Files to Modify:**
- `lib/atge/backtestingEngine.ts`

**Implementation Steps:**
1. Calculate P/L for each TP hit (weighted by allocation)
2. Calculate loss if SL hit (weighted by remaining allocation)
3. Sum all P/L to get net P/L
4. Calculate P/L percentage relative to entry price
5. Calculate trade duration in minutes
6. Handle edge case: no targets hit (expired)

**P/L Calculation Logic:**
```typescript
let profitLossUsd = 0;

// TP1 profit
if (tp1Hit) {
  const profit = (tp1Price - entryPrice) * (tp1Allocation / 100);
  profitLossUsd += profit;
}

// TP2 profit
if (tp2Hit) {
  const profit = (tp2Price - entryPrice) * (tp2Allocation / 100);
  profitLossUsd += profit;
}

// TP3 profit
if (tp3Hit) {
  const profit = (tp3Price - entryPrice) * (tp3Allocation / 100);
  profitLossUsd += profit;
}

// Stop loss
if (stopLossHit) {
  const loss = (stopLossPrice - entryPrice) * (remainingAllocation / 100);
  profitLossUsd += loss; // Will be negative
}

// Calculate percentage
const profitLossPercentage = (profitLossUsd / entryPrice) * 100;

// Calculate duration
const tradeDurationMinutes = Math.floor(


  (lastCandle.timestamp.getTime() - generatedAt.getTime()) / 60000
);
```


**Acceptance Criteria:**
- [ ] P/L calculated for each TP hit














- [ ] Loss calculated for SL hit
- [ ] Net P/L is sum of all P/L
- [ ] P/L percentage is accurate


- [x] Trade duration calculated correctly

- [ ] Handles zero P/L (expired, no hits)
- [ ] Unit tests for all scenarios

**Purpose:** Provide accurate financial results

---

#### Task 6.4: Handle Edge Cases
**Status:** 🔴 Not Started  
**Estimated Time:** 1 hour  
**Priority:** High  
**Dependencies:** Task 6.3

**Description:**
Implement robust error handling for edge cases in backtesting.

**Files to Modify:**
- `lib/atge/backtestingEngine.ts`

**Implementation Steps:**
1. Handle: Trade expires before any target hit
2. Handle: Stop loss hit immediately (first candle)
3. Handle: All 3 TPs hit in sequence
4. Handle: Insufficient historical data (data quality <70%)
5. Handle: Missing candles in timeframe
6. Handle: Invalid trade parameters
7. Return appropriate status for each case

**Edge Cases:**
```typescript
// Case 1: Expired (no targets hit)
if (!tp1Hit && !tp2Hit && !tp3Hit && !stopLossHit) {
  return {
    ...result,
    status: 'expired',
    profitLossUsd: 0,
    profitLossPercentage: 0
  };
}

// Case 2: Insufficient data
if (dataQuality < 70) {
  return {
    ...result,
    status: 'incomplete_data',
    error: 'Insufficient historical data for accurate backtesting'
  };
}

// Case 3: Stop loss hit immediately
if (stopLossHit && !tp1Hit && !tp2Hit && !tp3Hit) {
  return {
    ...result,
    status: 'completed_failure',
    profitLossUsd: loss,
    profitLossPercentage: lossPercentage
  };
}

// Case 4: All TPs hit
if (tp1Hit && tp2Hit && tp3Hit) {
  return {
    ...result,
    status: 'completed_success',
    profitLossUsd: totalProfit,
    profitLossPercentage: profitPercentage
  };
}
```

**Acceptance Criteria:**
- [x] Handles expired trades correctly





- [x] Handles immediate stop loss


- [x] Handles all TPs hit
- [x] Handles insufficient data
- [x] Returns appropriate status for each case





- [x] Error messages are descriptive






- [x] Unit tests for all edge cases





**Purpose:** Robust error handling

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

## Implementation Details

### Database Schema

#### atge_historical_prices Table
```sql
CREATE TABLE atge_historical_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(10) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  timeframe VARCHAR(10) NOT NULL, -- '15m', '1h', '4h', '1d', '1w'
  data_source VARCHAR(50) NOT NULL, -- 'coingecko', 'coinmarketcap'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historical_prices_lookup ON atge_historical_prices(symbol, timestamp, timeframe);
CREATE INDEX idx_historical_prices_symbol_timeframe ON atge_historical_prices(symbol, timeframe);
```

#### atge_backtest_queue Table
```sql
CREATE TABLE atge_backtest_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES atge_trade_signals(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_backtest_queue_status ON atge_backtest_queue(status, priority);
CREATE INDEX idx_backtest_queue_trade ON atge_backtest_queue(trade_id);
```

### Backtesting Engine Core Logic

```typescript
// lib/atge/backtestingEngine.ts
interface BacktestInput {
  tradeId: string;
  symbol: string;
  entryPrice: number;
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  stopLossPrice: number;
  timeframe: string;
  timeframeHours: number;
  generatedAt: Date;
}

interface BacktestResult {
  actualEntryPrice: number;
  tp1Hit: boolean;
  tp1HitAt?: Date;
  tp1HitPrice?: number;
  tp2Hit: boolean;
  tp2HitAt?: Date;
  tp2HitPrice?: number;
  tp3Hit: boolean;
  tp3HitAt?: Date;
  tp3HitPrice?: number;
  stopLossHit: boolean;
  stopLossHitAt?: Date;
  stopLossHitPrice?: number;
  profitLossUsd: number;
  profitLossPercentage: number;
  tradeDurationMinutes: number;
  netProfitLossUsd: number;
  dataSource: string;
  dataResolution: string;
  dataQualityScore: number;
}

export async function runBacktest(input: BacktestInput): Promise<BacktestResult> {
  // 1. Fetch historical price data for the timeframe
  const endTime = new Date(input.generatedAt.getTime() + input.timeframeHours * 60 * 60 * 1000);
  const historicalPrices = await fetchHistoricalPrices(
    input.symbol,
    input.generatedAt,
    endTime,
    input.timeframe
  );
  
  // 2. Validate data quality
  const dataQuality = calculateDataQuality(historicalPrices, input.generatedAt, endTime);
  if (dataQuality < 50) {
    throw new Error('Insufficient data quality for backtesting');
  }
  
  // 3. Initialize result
  const result: BacktestResult = {
    actualEntryPrice: input.entryPrice,
    tp1Hit: false,
    tp2Hit: false,
    tp3Hit: false,
    stopLossHit: false,
    profitLossUsd: 0,
    profitLossPercentage: 0,
    tradeDurationMinutes: 0,
    netProfitLossUsd: 0,
    dataSource: 'coingecko',
    dataResolution: input.timeframe,
    dataQualityScore: dataQuality
  };
  
  // 4. Iterate through historical prices to detect target hits
  let remainingAllocation = 100; // Start with 100% position
  
  for (const candle of historicalPrices) {
    // Check stop loss first (highest priority)
    if (candle.low <= input.stopLossPrice && !result.stopLossHit) {
      result.stopLossHit = true;
      result.stopLossHitAt = candle.timestamp;
      result.stopLossHitPrice = input.stopLossPrice;
      
      // Calculate loss for remaining position
      const loss = (input.stopLossPrice - input.entryPrice) * (remainingAllocation / 100);
      result.profitLossUsd += loss;
      
      // Trade ends when stop loss is hit
      result.tradeDurationMinutes = Math.floor(
        (candle.timestamp.getTime() - input.generatedAt.getTime()) / 60000
      );
      break;
    }
    
    // Check TP1
    if (candle.high >= input.tp1Price && !result.tp1Hit && remainingAllocation > 0) {
      result.tp1Hit = true;
      result.tp1HitAt = candle.timestamp;
      result.tp1HitPrice = input.tp1Price;
      
      // Calculate profit for TP1 allocation
      const profit = (input.tp1Price - input.entryPrice) * (input.tp1Allocation / 100);
      result.profitLossUsd += profit;
      remainingAllocation -= input.tp1Allocation;
    }
    
    // Check TP2
    if (candle.high >= input.tp2Price && !result.tp2Hit && remainingAllocation > 0) {
      result.tp2Hit = true;
      result.tp2HitAt = candle.timestamp;
      result.tp2HitPrice = input.tp2Price;
      
      // Calculate profit for TP2 allocation
      const profit = (input.tp2Price - input.entryPrice) * (input.tp2Allocation / 100);
      result.profitLossUsd += profit;
      remainingAllocation -= input.tp2Allocation;
    }
    
    // Check TP3
    if (candle.high >= input.tp3Price && !result.tp3Hit && remainingAllocation > 0) {
      result.tp3Hit = true;
      result.tp3HitAt = candle.timestamp;
      result.tp3HitPrice = input.tp3Price;
      
      // Calculate profit for TP3 allocation
      const profit = (input.tp3Price - input.entryPrice) * (input.tp3Allocation / 100);
      result.profitLossUsd += profit;
      remainingAllocation -= input.tp3Allocation;
      
      // All targets hit, trade complete
      result.tradeDurationMinutes = Math.floor(
        (candle.timestamp.getTime() - input.generatedAt.getTime()) / 60000
      );
      break;
    }
  }
  
  // 5. Calculate final metrics
  result.profitLossPercentage = (result.profitLossUsd / input.entryPrice) * 100;
  result.netProfitLossUsd = result.profitLossUsd;
  
  // If trade didn't complete, calculate duration as full timeframe
  if (result.tradeDurationMinutes === 0) {
    result.tradeDurationMinutes = input.timeframeHours * 60;
  }
  
  return result;
}
```

### Auto-Trigger on ATGE Visit

```typescript
// hooks/useATGEAutoBacktest.ts
import { useEffect, useState } from 'react';

export function useATGEAutoBacktest(userId: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  useEffect(() => {
    const triggerBacktesting = async () => {
      setIsProcessing(true);
      
      try {
        // 1. Check for pending trades
        const response = await fetch(`/api/atge/backtest/check-pending?userId=${userId}`);
        const { pendingCount } = await response.json();
        
        if (pendingCount > 0) {
          // 2. Trigger background processing
          await fetch('/api/atge/backtest/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
          
          // 3. Poll for progress
          const interval = setInterval(async () => {
            const progressRes = await fetch(`/api/atge/backtest/progress?userId=${userId}`);
            const progressData = await progressRes.json();
            
            setProgress({
              current: progressData.completed,
              total: progressData.total
            });
            
            if (progressData.completed >= progressData.total) {
              clearInterval(interval);
              setIsProcessing(false);
            }
          }, 2000);
        } else {
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Auto-backtest error:', error);
        setIsProcessing(false);
      }
    };
    
    triggerBacktesting();
  }, [userId]);
  
  return { isProcessing, progress };
}
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

---

## Summary

This specification has evolved from a simple UI fix to a **comprehensive historical backtesting system** for the ATGE (AI Trade Generation Engine). The system will:

1. **Fetch and store historical OHLCV data** from CoinGecko/CoinMarketCap
2. **Automatically backtest trades** when users visit the ATGE section
3. **Calculate accurate P/L** based on actual historical price movements
4. **Integrate additional data sources** (LunarCrush, Blockchain.com, Fear & Greed Index)
5. **Provide real-time progress updates** during backtesting
6. **Validate data quality** to ensure accurate results

**Key Benefits:**
- ✅ Accurate trade results based on real historical data
- ✅ Automatic processing without manual intervention
- ✅ Comprehensive data from multiple sources
- ✅ Scalable background job system
- ✅ High data quality validation

**Implementation Approach:**
- Phased deployment (9 phases)
- Comprehensive testing at each phase
- Database-backed for reliability
- API-driven for flexibility
- User-friendly progress tracking

**Estimated Completion:** 15-20 hours (2-3 days of focused work)
