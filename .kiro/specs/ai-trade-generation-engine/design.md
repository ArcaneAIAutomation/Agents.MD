# AI Trade Generation Engine (ATGE) - Design Document

## Overview

The AI Trade Generation Engine is a comprehensive trading signal system that generates, backtests, and analyzes cryptocurrency trades using advanced AI models (GPT-4o, Gemini) and real historical market data. The system provides complete transparency by displaying all trades with their actual profit/loss results based on standardized $1000 trade sizes.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ ATGE Interface│  │ Performance  │  │ Trade History      │   │
│  │              │  │ Dashboard    │  │ Table              │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js API Routes)              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Trade Signal │  │ Backtesting  │  │ Historical Data    │   │
│  │ Generation   │  │ Engine       │  │ Fetcher            │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ OpenAI GPT-4o│  │ CoinMarketCap│  │ CoinGecko API      │   │
│  │ Gemini AI    │  │ API          │  │                    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL Database                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ trade_signals│  │ trade_results│  │ trade_technical_   │   │
│  │              │  │              │  │ indicators         │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ trade_market_│  │ trade_        │                           │
│  │ snapshot     │  │ historical_   │                           │
│  │              │  │ prices        │                           │
│  └──────────────┘  └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

1. **Frontend Components**
   - ATGE Interface: Main trade generation UI
   - Performance Dashboard: Statistics and analytics
   - Trade History Table: Complete trade record
   - Proof of Performance: Visual showcase of accuracy

2. **API Routes**
   - `/api/atge/generate` - Generate new trade signal
   - `/api/atge/trades` - Fetch all trades
   - `/api/atge/backtest` - Run backtesting
   - `/api/atge/historical-data` - Fetch historical prices
   - `/api/atge/analyze` - AI-powered trade analysis

3. **Background Jobs**
   - Historical data fetcher (on ATGE page load)
   - Expired trade checker (runs every 5 minutes)
   - Backtesting processor (triggered on expiration)

## Database Schema

### Priority 1: Core Tables (Create First)

#### 1. `trade_signals` Table

**Purpose**: Stores all generated trade signals with complete details

```sql
CREATE TABLE trade_signals (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User & Symbol
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL DEFAULT 'BTC',
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  -- Values: 'active', 'completed_success', 'completed_failure', 'expired', 'incomplete_data'
  
  -- Entry & Exit Prices
  entry_price DECIMAL(20, 8) NOT NULL,
  
  -- Take Profit Levels
  tp1_price DECIMAL(20, 8) NOT NULL,
  tp1_allocation DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
  tp2_price DECIMAL(20, 8) NOT NULL,
  tp2_allocation DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
  tp3_price DECIMAL(20, 8) NOT NULL,
  tp3_allocation DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
  
  -- Stop Loss
  stop_loss_price DECIMAL(20, 8) NOT NULL,
  stop_loss_percentage DECIMAL(5, 2) NOT NULL,
  
  -- Timeframe
  timeframe VARCHAR(10) NOT NULL,
  -- Values: '1h', '4h', '1d', '1w'
  timeframe_hours INTEGER NOT NULL,
  -- Values: 1, 4, 24, 168
  
  -- AI Analysis
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  risk_reward_ratio DECIMAL(10, 2) NOT NULL,
  market_condition VARCHAR(50) NOT NULL,
  -- Values: 'trending', 'ranging', 'volatile'
  ai_reasoning TEXT NOT NULL,
  ai_model_version VARCHAR(100) NOT NULL,
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trade_signals_user_id ON trade_signals(user_id);
CREATE INDEX idx_trade_signals_symbol ON trade_signals(symbol);
CREATE INDEX idx_trade_signals_status ON trade_signals(status);
CREATE INDEX idx_trade_signals_generated_at ON trade_signals(generated_at DESC);
CREATE INDEX idx_trade_signals_expires_at ON trade_signals(expires_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trade_signals_updated_at
BEFORE UPDATE ON trade_signals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### 2. `trade_results` Table

**Purpose**: Stores backtesting results and actual outcomes

```sql
CREATE TABLE trade_results (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- Actual Prices
  actual_entry_price DECIMAL(20, 8) NOT NULL,
  actual_exit_price DECIMAL(20, 8),
  
  -- Take Profit 1
  tp1_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp1_hit_at TIMESTAMP WITH TIME ZONE,
  tp1_hit_price DECIMAL(20, 8),
  
  -- Take Profit 2
  tp2_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp2_hit_at TIMESTAMP WITH TIME ZONE,
  tp2_hit_price DECIMAL(20, 8),
  
  -- Take Profit 3
  tp3_hit BOOLEAN NOT NULL DEFAULT FALSE,
  tp3_hit_at TIMESTAMP WITH TIME ZONE,
  tp3_hit_price DECIMAL(20, 8),
  
  -- Stop Loss
  stop_loss_hit BOOLEAN NOT NULL DEFAULT FALSE,
  stop_loss_hit_at TIMESTAMP WITH TIME ZONE,
  stop_loss_hit_price DECIMAL(20, 8),
  
  -- Profit/Loss Calculations
  profit_loss_usd DECIMAL(20, 2),
  profit_loss_percentage DECIMAL(10, 4),
  trade_duration_minutes INTEGER,
  
  -- Trade Size & Fees
  trade_size_usd DECIMAL(20, 2) NOT NULL DEFAULT 1000.00,
  fees_usd DECIMAL(20, 2) NOT NULL DEFAULT 2.00,
  -- 0.1% entry + 0.1% exit = 0.2% of $1000 = $2
  slippage_usd DECIMAL(20, 2) NOT NULL DEFAULT 2.00,
  -- 0.1% entry + 0.1% exit = 0.2% of $1000 = $2
  net_profit_loss_usd DECIMAL(20, 2),
  
  -- Data Quality
  data_source VARCHAR(50) NOT NULL,
  -- Values: 'CoinMarketCap', 'CoinGecko'
  data_resolution VARCHAR(10) NOT NULL,
  -- Values: '1m', '5m', '1h'
  data_quality_score INTEGER NOT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- AI Analysis
  ai_analysis TEXT,
  
  -- Timestamps
  backtested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_trade_result UNIQUE (trade_signal_id)
);

-- Indexes
CREATE INDEX idx_trade_results_trade_signal_id ON trade_results(trade_signal_id);
CREATE INDEX idx_trade_results_profit_loss ON trade_results(profit_loss_usd DESC);
CREATE INDEX idx_trade_results_backtested_at ON trade_results(backtested_at DESC);
```

#### 3. `trade_technical_indicators` Table

**Purpose**: Stores technical indicator values at signal generation time

```sql
CREATE TABLE trade_technical_indicators (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- RSI
  rsi_value DECIMAL(10, 4),
  
  -- MACD
  macd_value DECIMAL(20, 8),
  macd_signal DECIMAL(20, 8),
  macd_histogram DECIMAL(20, 8),
  
  -- EMAs
  ema_20 DECIMAL(20, 8),
  ema_50 DECIMAL(20, 8),
  ema_200 DECIMAL(20, 8),
  
  -- Bollinger Bands
  bollinger_upper DECIMAL(20, 8),
  bollinger_middle DECIMAL(20, 8),
  bollinger_lower DECIMAL(20, 8),
  
  -- ATR
  atr_value DECIMAL(20, 8),
  
  -- Volume & Market Cap
  volume_24h DECIMAL(30, 2),
  market_cap DECIMAL(30, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_trade_indicators UNIQUE (trade_signal_id)
);

-- Index
CREATE INDEX idx_trade_technical_indicators_trade_signal_id ON trade_technical_indicators(trade_signal_id);
```

#### 4. `trade_market_snapshot` Table

**Purpose**: Stores market conditions at signal generation time

```sql
CREATE TABLE trade_market_snapshot (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- Price Data
  current_price DECIMAL(20, 8) NOT NULL,
  price_change_24h DECIMAL(10, 4),
  volume_24h DECIMAL(30, 2),
  market_cap DECIMAL(30, 2),
  
  -- Sentiment Data
  social_sentiment_score INTEGER CHECK (social_sentiment_score >= 0 AND social_sentiment_score <= 100),
  whale_activity_count INTEGER DEFAULT 0,
  fear_greed_index INTEGER CHECK (fear_greed_index >= 0 AND fear_greed_index <= 100),
  
  -- Timestamps
  snapshot_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_trade_snapshot UNIQUE (trade_signal_id)
);

-- Index
CREATE INDEX idx_trade_market_snapshot_trade_signal_id ON trade_market_snapshot(trade_signal_id);
```

#### 5. `trade_historical_prices` Table

**Purpose**: Stores historical OHLCV data for backtesting and verification

```sql
CREATE TABLE trade_historical_prices (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  trade_signal_id UUID NOT NULL REFERENCES trade_signals(id) ON DELETE CASCADE,
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- OHLCV Data
  open_price DECIMAL(20, 8) NOT NULL,
  high_price DECIMAL(20, 8) NOT NULL,
  low_price DECIMAL(20, 8) NOT NULL,
  close_price DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(30, 2),
  
  -- Data Source
  data_source VARCHAR(50) NOT NULL,
  -- Values: 'CoinMarketCap', 'CoinGecko'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_historical_price UNIQUE (trade_signal_id, timestamp, data_source)
);

-- Indexes
CREATE INDEX idx_trade_historical_prices_trade_signal_id ON trade_historical_prices(trade_signal_id);
CREATE INDEX idx_trade_historical_prices_timestamp ON trade_historical_prices(timestamp);
```

### Database Migration Script

**File**: `migrations/001_create_atge_tables.sql`

```sql
-- Migration: Create ATGE Tables
-- Description: Creates all tables for AI Trade Generation Engine
-- Date: 2025-01-XX
-- Author: System

BEGIN;

-- 1. Create trade_signals table
-- (SQL from above)

-- 2. Create trade_results table
-- (SQL from above)

-- 3. Create trade_technical_indicators table
-- (SQL from above)

-- 4. Create trade_market_snapshot table
-- (SQL from above)

-- 5. Create trade_historical_prices table
-- (SQL from above)

COMMIT;
```

## Data Models

### TypeScript Interfaces

```typescript
// types/atge.ts

export interface TradeSignal {
  id: string;
  userId: string;
  symbol: string;
  status: 'active' | 'completed_success' | 'completed_failure' | 'expired' | 'incomplete_data';
  
  // Entry & Exit
  entryPrice: number;
  
  // Take Profit Levels
  tp1Price: number;
  tp1Allocation: number;
  tp2Price: number;
  tp2Allocation: number;
  tp3Price: number;
  tp3Allocation: number;
  
  // Stop Loss
  stopLossPrice: number;
  stopLossPercentage: number;
  
  // Timeframe
  timeframe: '1h' | '4h' | '1d' | '1w';
  timeframeHours: number;
  
  // AI Analysis
  confidenceScore: number;
  riskRewardRatio: number;
  marketCondition: 'trending' | 'ranging' | 'volatile';
  aiReasoning: string;
  aiModelVersion: string;
  
  // Timestamps
  generatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeResult {
  id: string;
  tradeSignalId: string;
  
  // Actual Prices
  actualEntryPrice: number;
  actualExitPrice?: number;
  
  // Targets Hit
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
  
  // P/L
  profitLossUsd?: number;
  profitLossPercentage?: number;
  tradeDurationMinutes?: number;
  
  // Fees & Slippage
  tradeSizeUsd: number;
  feesUsd: number;
  slippageUsd: number;
  netProfitLossUsd?: number;
  
  // Data Quality
  dataSource: string;
  dataResolution: string;
  dataQualityScore: number;
  
  // AI Analysis
  aiAnalysis?: string;
  
  // Timestamps
  backtestedAt: Date;
  createdAt: Date;
}

export interface TechnicalIndicators {
  id: string;
  tradeSignalId: string;
  
  // RSI
  rsiValue?: number;
  
  // MACD
  macdValue?: number;
  macdSignal?: number;
  macdHistogram?: number;
  
  // EMAs
  ema20?: number;
  ema50?: number;
  ema200?: number;
  
  // Bollinger Bands
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
  
  // ATR
  atrValue?: number;
  
  // Volume & Market Cap
  volume24h?: number;
  marketCap?: number;
  
  createdAt: Date;
}

export interface MarketSnapshot {
  id: string;
  tradeSignalId: string;
  
  // Price Data
  currentPrice: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  
  // Sentiment
  socialSentimentScore?: number;
  whaleActivityCount?: number;
  fearGreedIndex?: number;
  
  // Timestamps
  snapshotAt: Date;
  createdAt: Date;
}

export interface HistoricalPrice {
  id: string;
  tradeSignalId: string;
  timestamp: Date;
  
  // OHLCV
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume?: number;
  
  // Source
  dataSource: string;
  
  createdAt: Date;
}

// Complete Trade with all related data
export interface CompleteTrade extends TradeSignal {
  result?: TradeResult;
  indicators?: TechnicalIndicators;
  snapshot?: MarketSnapshot;
  historicalPrices?: HistoricalPrice[];
}
```

## Components and Interfaces

### Frontend Components

#### 1. ATGE Main Interface

**File**: `components/ATGE/ATGEInterface.tsx`

```typescript
interface ATGEInterfaceProps {
  user: User;
}

export default function ATGEInterface({ user }: ATGEInterfaceProps) {
  // State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<'BTC' | 'ETH'>('BTC');
  
  // Handlers
  const handleUnlock = async (password: string) => {
    // Verify password and unlock interface
  };
  
  const handleGenerateTrade = async () => {
    // Generate new trade signal
  };
  
  return (
    <div className="atge-interface">
      {!isUnlocked ? (
        <UnlockModal onUnlock={handleUnlock} />
      ) : (
        <>
          <SymbolSelector 
            selected={selectedSymbol}
            onChange={setSelectedSymbol}
          />
          <GenerateButton 
            onClick={handleGenerateTrade}
            disabled={isGenerating || selectedSymbol === 'ETH'}
          />
          <PerformanceSummary symbol={selectedSymbol} />
          <TradeHistoryTable symbol={selectedSymbol} />
        </>
      )}
    </div>
  );
}
```

#### 2. Performance Dashboard

**File**: `components/ATGE/PerformanceDashboard.tsx`

```typescript
interface PerformanceDashboardProps {
  symbol: string;
}

export default function PerformanceDashboard({ symbol }: PerformanceDashboardProps) {
  const { data: stats, isLoading } = usePerformanceStats(symbol);
  
  return (
    <div className="performance-dashboard">
      <PerformanceSummaryCard stats={stats} />
      <ProofOfPerformance stats={stats} />
      <VisualAnalytics stats={stats} />
      <AdvancedMetrics stats={stats} />
    </div>
  );
}
```

#### 3. Trade History Table

**File**: `components/ATGE/TradeHistoryTable.tsx`

```typescript
interface TradeHistoryTableProps {
  symbol: string;
}

export default function TradeHistoryTable({ symbol }: TradeHistoryTableProps) {
  const { data: trades, isLoading } = useAllTrades(symbol);
  const [filters, setFilters] = useState<TradeFilters>({});
  
  return (
    <div className="trade-history-table">
      <TradeFilters filters={filters} onChange={setFilters} />
      <TradeCount total={trades?.length || 0} />
      <Table>
        {trades?.map(trade => (
          <TradeRow key={trade.id} trade={trade} />
        ))}
      </Table>
    </div>
  );
}
```

### API Routes

#### 1. Generate Trade Signal

**File**: `pages/api/atge/generate.ts`

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 2. Get request data
    const { symbol } = req.body;
    
    // 3. Fetch market data
    const marketData = await fetchMarketData(symbol);
    const technicalIndicators = await calculateTechnicalIndicators(symbol);
    const sentimentData = await fetchSentimentData(symbol);
    const onChainData = await fetchOnChainData(symbol);
    
    // 4. Generate trade signal with AI
    const tradeSignal = await generateTradeSignalWithAI({
      symbol,
      marketData,
      technicalIndicators,
      sentimentData,
      onChainData
    });
    
    // 5. Store in database
    const storedSignal = await storeTradeSignal(tradeSignal, authResult.user.id);
    
    // 6. Return response
    return res.status(200).json({
      success: true,
      trade: storedSignal
    });
  } catch (error) {
    console.error('Trade generation error:', error);
    return res.status(500).json({ error: 'Failed to generate trade signal' });
  }
}
```

#### 2. Fetch All Trades

**File**: `pages/api/atge/trades.ts`

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 2. Get query parameters
    const { symbol, status, timeframe, startDate, endDate } = req.query;
    
    // 3. Fetch trades from database
    const trades = await fetchAllTrades({
      userId: authResult.user.id,
      symbol,
      status,
      timeframe,
      startDate,
      endDate
    });
    
    // 4. Return response
    return res.status(200).json({
      success: true,
      trades,
      total: trades.length
    });
  } catch (error) {
    console.error('Fetch trades error:', error);
    return res.status(500).json({ error: 'Failed to fetch trades' });
  }
}
```

#### 3. Fetch Historical Data

**File**: `pages/api/atge/historical-data.ts`

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 2. Get request data
    const { tradeSignalId } = req.body;
    
    // 3. Fetch trade signal
    const tradeSignal = await fetchTradeSignal(tradeSignalId);
    
    // 4. Fetch historical data
    const historicalData = await fetchHistoricalPriceData({
      symbol: tradeSignal.symbol,
      startTime: tradeSignal.generatedAt,
      endTime: tradeSignal.expiresAt,
      resolution: '1m'
    });
    
    // 5. Store in database
    await storeHistoricalPrices(tradeSignalId, historicalData);
    
    // 6. Analyze for target hits
    const analysis = await analyzeTargetHits(tradeSignal, historicalData);
    
    // 7. Store results
    await storeTradeResults(tradeSignalId, analysis);
    
    // 8. Return response
    return res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Historical data fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch historical data' });
  }
}
```

## Error Handling

### Error Types

```typescript
export enum ATGEErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA'
}

export class ATGEError extends Error {
  constructor(
    public type: ATGEErrorType,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ATGEError';
  }
}
```

### Error Handling Strategy

1. **API Errors**: Retry with exponential backoff (3 attempts)
2. **Database Errors**: Log and return user-friendly message
3. **AI Errors**: Fallback to Gemini if GPT-4o fails
4. **Rate Limits**: Queue requests and process sequentially
5. **Validation Errors**: Return specific field errors

## Testing Strategy

### Unit Tests

- Database query functions
- Trade signal generation logic
- Backtesting calculations
- P/L calculations with fees and slippage

### Integration Tests

- Complete trade generation flow
- Historical data fetching and analysis
- Database storage and retrieval
- AI integration (GPT-4o, Gemini)

### End-to-End Tests

- User generates trade signal
- System fetches historical data
- Backtesting completes
- Results displayed in UI
- Performance dashboard updates

## Next Steps

1. **Create Database Tables** (Priority 1)
   - Run migration script
   - Verify tables created
   - Test constraints and indexes

2. **Implement Core API Routes** (Priority 2)
   - Trade signal generation
   - Historical data fetching
   - Backtesting engine

3. **Build Frontend Components** (Priority 3)
   - ATGE interface
   - Performance dashboard
   - Trade history table

4. **Integrate AI Models** (Priority 4)
   - GPT-4o for trade generation
   - GPT-4o for trade analysis
   - Gemini as fallback

5. **Testing & Optimization** (Priority 5)
   - Unit tests
   - Integration tests
   - Performance optimization
   - Mobile responsiveness

---

**Design Status**: ✅ Complete - Ready for Implementation  
**Next Phase**: Create database tables and begin implementation
