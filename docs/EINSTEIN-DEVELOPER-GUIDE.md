# Einstein Trade Engine - Developer Documentation

**Version**: 2.0.0  
**Last Updated**: January 27, 2025  
**Status**: Production Ready ✅

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Data Flow](#data-flow)
6. [Code Examples](#code-examples)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing](#contributing)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Einstein Trade Engine                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Einstein Engine Coordinator                 │
│                 (lib/einstein/coordinator/)                  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Data Collection │ │   AI Analysis    │ │  Risk Calculator │
│   (lib/data/)    │ │ (lib/analysis/)  │ │   (lib/risk/)    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   13+ APIs       │ │   GPT-5.1 API    │ │  Approval Flow   │
│  (Real-time)     │ │ (High Reasoning) │ │  (lib/workflow/) │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Supabase DB     │
                    │  (PostgreSQL)    │
                    └──────────────────┘
```

### Technology Stack

- **Runtime**: Node.js 18+, TypeScript 5.2
- **Framework**: Next.js 14 (API Routes)
- **Database**: Supabase PostgreSQL (port 6543)
- **AI**: OpenAI GPT-5.1 with Responses API
- **APIs**: 13+ real-time data sources
- **Styling**: Tailwind CSS (Bitcoin Sovereign theme)
- **Testing**: Jest, Integration tests

### Design Principles

1. **Real Data Only**: No mock data, no fallbacks, 99% accuracy
2. **Database-First**: All data stored in Supabase for persistence
3. **User Approval**: No automatic execution, user must approve
4. **Risk Management**: 2% max risk per trade, 2:1 min risk-reward
5. **Performance**: <30s total, <10s data collection, <15s AI analysis

---

## Core Components

### 1. Einstein Engine Coordinator

**Location**: `lib/einstein/coordinator/engine.ts`

**Purpose**: Orchestrates the entire trade signal generation process

**Key Methods**:

```typescript
class EinsteinEngineCoordinator {
  /**
   * Generate a complete trade signal
   * @param symbol - Cryptocurrency symbol (e.g., 'BTC')
   * @param timeframe - Analysis timeframe (e.g., '1h', '4h')
   * @returns Complete trade signal with analysis
   */
  async generateTradeSignal(
    symbol: string,
    timeframe: string
  ): Promise<TradeSignal>
  
  /**
   * Validate data quality before analysis
   * @param data - Collected market data
   * @returns Data quality score (0-100)
   */
  private validateDataQuality(data: any): number
  
  /**
   * Calculate risk parameters
   * @param analysis - AI analysis results
   * @returns Risk parameters (stop-loss, take-profits, position size)
   */
  private calculateRiskParameters(analysis: any): RiskParameters
}
```

**Usage Example**:

```typescript
import { EinsteinEngineCoordinator } from '../lib/einstein/coordinator/engine';

const coordinator = new EinsteinEngineCoordinator();

try {
  const signal = await coordinator.generateTradeSignal('BTC', '1h');
  
  console.log('Position Type:', signal.positionType);
  console.log('Entry Price:', signal.entryPrice);
  console.log('Confidence:', signal.confidenceScore);
  console.log('Data Quality:', signal.dataQualityScore);
} catch (error) {
  console.error('Signal generation failed:', error);
}
```

### 2. Data Collection Module

**Location**: `lib/einstein/data/collector.ts`

**Purpose**: Fetch and validate data from 13+ APIs

**Key Methods**:

```typescript
class DataCollectionModule {
  /**
   * Fetch market data (price, volume, market cap)
   * Sources: CoinMarketCap, CoinGecko, Kraken
   */
  async fetchMarketData(symbol: string): Promise<MarketData>
  
  /**
   * Fetch sentiment data (social metrics, news)
   * Sources: LunarCrush, Twitter/X, Reddit
   */
  async fetchSentimentData(symbol: string): Promise<SentimentData>
  
  /**
   * Fetch on-chain data (whale activity, exchange flows)
   * Sources: Etherscan, Blockchain.com
   */
  async fetchOnChainData(symbol: string): Promise<OnChainData>
  
  /**
   * Calculate technical indicators
   * Indicators: RSI, MACD, EMA, Bollinger, ATR, Stochastic
   */
  async fetchTechnicalIndicators(symbol: string): Promise<TechnicalData>
  
  /**
   * Validate all collected data
   * Checks: Freshness (<5min), completeness, cross-source validation
   */
  validateAllData(data: any): DataQualityScore
}
```

**Usage Example**:

```typescript
import { DataCollectionModule } from '../lib/einstein/data/collector';

const collector = new DataCollectionModule();

// Fetch all data in parallel
const [market, sentiment, onChain, technical] = await Promise.all([
  collector.fetchMarketData('BTC'),
  collector.fetchSentimentData('BTC'),
  collector.fetchOnChainData('BTC'),
  collector.fetchTechnicalIndicators('BTC')
]);

// Validate data quality
const quality = collector.validateAllData({
  market,
  sentiment,
  onChain,
  technical
});

console.log('Data Quality:', quality.score); // Must be ≥90%
```

### 3. GPT-5.1 Analysis Engine

**Location**: `lib/einstein/analysis/gpt51.ts`

**Purpose**: AI-powered market analysis with high reasoning

**Key Methods**:

```typescript
class GPT51AnalysisEngine {
  /**
   * Analyze market with GPT-5.1 (high reasoning mode)
   * @param data - Complete market data
   * @returns AI analysis with reasoning
   */
  async analyzeMarket(data: ComprehensiveData): Promise<AIAnalysis>
  
  /**
   * Determine position type (LONG, SHORT, NO_TRADE)
   * @param data - Market data
   * @returns Position type with confidence
   */
  async determinePositionType(data: ComprehensiveData): Promise<PositionType>
  
  /**
   * Calculate confidence score
   * @param data - Market data
   * @returns Confidence score (0-100)
   */
  async calculateConfidence(data: ComprehensiveData): Promise<number>
  
  /**
   * Generate detailed reasoning
   * @param analysis - AI analysis
   * @returns Human-readable reasoning
   */
  generateReasoning(analysis: AIAnalysis): string
}
```

**Usage Example**:

```typescript
import { GPT51AnalysisEngine } from '../lib/einstein/analysis/gpt51';
import { extractResponseText, validateResponseText } from '../utils/openai';

const aiEngine = new GPT51AnalysisEngine();

const analysis = await aiEngine.analyzeMarket({
  market: marketData,
  sentiment: sentimentData,
  onChain: onChainData,
  technical: technicalData
});

console.log('Position:', analysis.positionType);
console.log('Confidence:', analysis.confidence);
console.log('Reasoning:', analysis.reasoning);
```

**GPT-5.1 Configuration**:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1' // Required for GPT-5.1
  }
});

const completion = await openai.chat.completions.create({
  model: 'gpt-5.1',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  reasoning: {
    effort: 'high' // 'low' (1-2s), 'medium' (3-5s), 'high' (5-10s)
  },
  temperature: 0.7,
  max_tokens: 8000
});

// Bulletproof response extraction
const responseText = extractResponseText(completion, true); // debug mode
validateResponseText(responseText, 'gpt-5.1', completion);
```

### 4. Approval Workflow Manager

**Location**: `lib/einstein/workflow/approval.ts`

**Purpose**: Handle user approval/rejection/modification

**Key Methods**:

```typescript
class ApprovalWorkflowManager {
  /**
   * Present signal for user approval
   * @param signal - Generated trade signal
   * @returns Approval ID
   */
  async presentSignal(signal: TradeSignal): Promise<string>
  
  /**
   * Handle user approval
   * @param signalId - Signal ID
   * @returns Approved signal
   */
  async handleApproval(signalId: string): Promise<TradeSignal>
  
  /**
   * Handle user rejection
   * @param signalId - Signal ID
   * @param reason - Rejection reason
   */
  async handleRejection(signalId: string, reason?: string): Promise<void>
  
  /**
   * Handle signal modification
   * @param signalId - Signal ID
   * @param modifications - User modifications
   * @returns Modified signal
   */
  async handleModification(
    signalId: string,
    modifications: Partial<TradeSignal>
  ): Promise<TradeSignal>
  
  /**
   * Check for approval timeout (5 minutes)
   * @param signalId - Signal ID
   * @returns true if expired
   */
  checkTimeout(signalId: string): boolean
}
```

### 5. Performance Tracker

**Location**: `lib/einstein/performance/tracker.ts`

**Purpose**: Track trade execution and performance

**Key Methods**:

```typescript
class PerformanceTracker {
  /**
   * Update trade status
   * @param tradeId - Trade ID
   * @param status - New status (PENDING, EXECUTED, CLOSED)
   */
  async updateTradeStatus(tradeId: string, status: TradeStatus): Promise<void>
  
  /**
   * Calculate unrealized P/L for open trades
   * @param tradeId - Trade ID
   * @returns Current P/L
   */
  async calculateUnrealizedPL(tradeId: string): Promise<number>
  
  /**
   * Calculate realized P/L for closed trades
   * @param tradeId - Trade ID
   * @returns Final P/L
   */
  async calculateRealizedPL(tradeId: string): Promise<number>
  
  /**
   * Check if targets are hit
   * @param tradeId - Trade ID
   * @returns Array of hit targets
   */
  async checkTargetsHit(tradeId: string): Promise<string[]>
  
  /**
   * Get performance metrics
   * @returns Win rate, avg profit, max drawdown
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics>
}
```

---

## API Endpoints

### 1. Generate Trade Signal

**Endpoint**: `POST /api/einstein/generate-signal`

**Request**:
```typescript
{
  symbol: string;      // 'BTC' or 'ETH'
  timeframe: string;   // '15m', '1h', '4h', '1d'
}
```

**Response**:
```typescript
{
  success: boolean;
  signal: {
    id: string;
    symbol: string;
    positionType: 'LONG' | 'SHORT' | 'NO_TRADE';
    entryPrice: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
    positionSize: number;
    confidenceScore: number;
    dataQualityScore: number;
    analysis: {
      technical: {...};
      sentiment: {...};
      onChain: {...};
      risk: {...};
      reasoning: string;
    };
    createdAt: string;
  };
}
```

**Example**:
```typescript
const response = await fetch('/api/einstein/generate-signal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'BTC',
    timeframe: '1h'
  })
});

const { signal } = await response.json();
```

### 2. Approve Trade Signal

**Endpoint**: `POST /api/einstein/approve-signal`

**Request**:
```typescript
{
  signalId: string;
  action: 'approve' | 'reject' | 'modify';
  modifications?: Partial<TradeSignal>;
  rejectionReason?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  trade?: TradeSignal;
}
```

### 3. Get Trade History

**Endpoint**: `GET /api/einstein/trade-history`

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: 'PENDING' | 'EXECUTED' | 'CLOSED' | 'ALL'
- `positionType`: 'LONG' | 'SHORT' | 'ALL'

**Response**:
```typescript
{
  success: boolean;
  trades: TradeSignal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### 4. Refresh Data

**Endpoint**: `POST /api/einstein/refresh-data`

**Request**:
```typescript
{
  symbol: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    market: MarketData;
    sentiment: SentimentData;
    onChain: OnChainData;
    technical: TechnicalData;
  };
  dataQuality: number;
  lastRefreshed: string;
}
```

### 5. Real-Time P/L

**Endpoint**: `GET /api/einstein/realtime-pl/:tradeId`

**Response**:
```typescript
{
  success: boolean;
  tradeId: string;
  status: TradeStatus;
  unrealizedPL: number;
  realizedPL: number;
  currentPrice: number;
  entryPrice: number;
  percentageReturn: number;
  lastUpdated: string;
}
```

### 6. Partial Close

**Endpoint**: `POST /api/einstein/partial-close`

**Request**:
```typescript
{
  tradeId: string;
  percentageClosed: number; // 0-100
  exitPrice: number;
}
```

**Response**:
```typescript
{
  success: boolean;
  trade: TradeSignal;
  realizedPL: number;
  remainingPosition: number;
}
```

---

## Database Schema

### Table: `einstein_trade_signals`

```sql
CREATE TABLE einstein_trade_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  symbol VARCHAR(10) NOT NULL,
  position_type VARCHAR(10) NOT NULL, -- LONG, SHORT, NO_TRADE
  entry_price DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8) NOT NULL,
  take_profit_1 DECIMAL(20, 8) NOT NULL,
  take_profit_2 DECIMAL(20, 8) NOT NULL,
  take_profit_3 DECIMAL(20, 8) NOT NULL,
  position_size DECIMAL(20, 8) NOT NULL,
  confidence_score INTEGER NOT NULL, -- 0-100
  data_quality_score INTEGER NOT NULL, -- 0-100
  timeframe VARCHAR(10) NOT NULL, -- 15m, 1h, 4h, 1d
  reasoning TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, EXECUTED, CLOSED
  executed_at TIMESTAMP,
  closed_at TIMESTAMP,
  realized_pl DECIMAL(20, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_einstein_signals_user ON einstein_trade_signals(user_id);
CREATE INDEX idx_einstein_signals_symbol ON einstein_trade_signals(symbol);
CREATE INDEX idx_einstein_signals_status ON einstein_trade_signals(status);
CREATE INDEX idx_einstein_signals_created ON einstein_trade_signals(created_at DESC);
```

### Table: `einstein_analysis_cache`

```sql
CREATE TABLE einstein_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(10) NOT NULL,
  analysis_type VARCHAR(50) NOT NULL, -- market_data, sentiment, on_chain, technical
  data JSONB NOT NULL,
  data_quality INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_einstein_cache_symbol_type 
  ON einstein_analysis_cache(symbol, analysis_type);
CREATE INDEX idx_einstein_cache_expires ON einstein_analysis_cache(expires_at);
```

### Table: `einstein_performance`

```sql
CREATE TABLE einstein_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES einstein_trade_signals(id),
  metric_type VARCHAR(50) NOT NULL, -- win_rate, avg_profit, max_drawdown
  metric_value DECIMAL(20, 8) NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_einstein_performance_trade ON einstein_performance(trade_id);
CREATE INDEX idx_einstein_performance_type ON einstein_performance(metric_type);
```

---

## Data Flow

### Signal Generation Flow

```
1. User clicks "Generate Signal"
   ↓
2. POST /api/einstein/generate-signal
   ↓
3. EinsteinEngineCoordinator.generateTradeSignal()
   ↓
4. DataCollectionModule.fetchAllData() [8-10s]
   ├─ fetchMarketData() → CoinMarketCap, CoinGecko, Kraken
   ├─ fetchSentimentData() → LunarCrush, Twitter, Reddit
   ├─ fetchOnChainData() → Etherscan, Blockchain.com
   └─ fetchTechnicalIndicators() → Calculate RSI, MACD, etc.
   ↓
5. validateDataQuality() [Must be ≥90%]
   ↓
6. GPT51AnalysisEngine.analyzeMarket() [10-15s]
   ├─ Build comprehensive prompt
   ├─ Call GPT-5.1 with high reasoning
   ├─ Extract and validate response
   └─ Parse AI analysis
   ↓
7. calculateRiskParameters()
   ├─ Position sizing (2% max risk)
   ├─ Stop-loss (ATR-based)
   ├─ Take-profits (Fibonacci, resistance, Bollinger)
   └─ Verify risk-reward ≥2:1
   ↓
8. Return complete signal to frontend
   ↓
9. Display EinsteinAnalysisModal
   ↓
10. User approves/rejects/modifies
    ↓
11. POST /api/einstein/approve-signal
    ↓
12. Save to einstein_trade_signals table
    ↓
13. Track performance with PerformanceTracker
```

### Data Caching Flow

```
1. Check einstein_analysis_cache table
   ↓
2. If cached and not expired (< 5 min old)
   └─ Return cached data
   ↓
3. If not cached or expired
   ├─ Fetch fresh data from APIs
   ├─ Validate data quality
   ├─ Store in cache with TTL
   └─ Return fresh data
```

---

## Code Examples

### Example 1: Generate Signal Programmatically

```typescript
import { EinsteinEngineCoordinator } from '../lib/einstein/coordinator/engine';

async function generateSignal() {
  const coordinator = new EinsteinEngineCoordinator();
  
  try {
    console.log('Generating signal for BTC...');
    
    const signal = await coordinator.generateTradeSignal('BTC', '1h');
    
    console.log('✅ Signal generated successfully!');
    console.log('Position:', signal.positionType);
    console.log('Entry:', signal.entryPrice);
    console.log('Stop-Loss:', signal.stopLoss);
    console.log('TP1:', signal.takeProfit1);
    console.log('TP2:', signal.takeProfit2);
    console.log('TP3:', signal.takeProfit3);
    console.log('Confidence:', signal.confidenceScore + '%');
    console.log('Data Quality:', signal.dataQualityScore + '%');
    
    return signal;
  } catch (error) {
    console.error('❌ Signal generation failed:', error.message);
    throw error;
  }
}

generateSignal();
```

### Example 2: Fetch and Validate Data

```typescript
import { DataCollectionModule } from '../lib/einstein/data/collector';

async function collectAndValidateData(symbol: string) {
  const collector = new DataCollectionModule();
  
  // Fetch all data in parallel
  const [market, sentiment, onChain, technical] = await Promise.all([
    collector.fetchMarketData(symbol),
    collector.fetchSentimentData(symbol),
    collector.fetchOnChainData(symbol),
    collector.fetchTechnicalIndicators(symbol)
  ]);
  
  // Validate data quality
  const quality = collector.validateAllData({
    market,
    sentiment,
    onChain,
    technical
  });
  
  if (quality.score < 90) {
    throw new Error(`Data quality too low: ${quality.score}% (minimum 90%)`);
  }
  
  console.log('✅ Data quality:', quality.score + '%');
  
  return { market, sentiment, onChain, technical };
}
```

### Example 3: Track Trade Performance

```typescript
import { PerformanceTracker } from '../lib/einstein/performance/tracker';

async function trackTrade(tradeId: string) {
  const tracker = new PerformanceTracker();
  
  // Update status to EXECUTED
  await tracker.updateTradeStatus(tradeId, 'EXECUTED');
  
  // Calculate unrealized P/L
  const unrealizedPL = await tracker.calculateUnrealizedPL(tradeId);
  console.log('Unrealized P/L:', unrealizedPL);
  
  // Check if targets are hit
  const targetsHit = await tracker.checkTargetsHit(tradeId);
  if (targetsHit.includes('TP1')) {
    console.log('🎯 TP1 hit! Consider closing 50% of position');
  }
  
  // Get overall performance metrics
  const metrics = await tracker.getPerformanceMetrics();
  console.log('Win Rate:', metrics.winRate + '%');
  console.log('Avg Profit:', metrics.avgProfit + '%');
  console.log('Max Drawdown:', metrics.maxDrawdown + '%');
}
```

### Example 4: Custom API Integration

```typescript
import { query } from '../lib/db';

async function getTradeHistory(userId: string, limit: number = 20) {
  const result = await query(
    `SELECT 
      id,
      symbol,
      position_type,
      entry_price,
      stop_loss,
      take_profit_1,
      take_profit_2,
      take_profit_3,
      confidence_score,
      data_quality_score,
      status,
      realized_pl,
      created_at
    FROM einstein_trade_signals
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2`,
    [userId, limit]
  );
  
  return result.rows;
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run performance tests
npx tsx scripts/test-einstein-performance.ts

# Run security tests
npx tsx scripts/test-einstein-security.ts

# Run integration tests
npm run test:integration
```

### Writing Tests

**Unit Test Example**:

```typescript
import { DataCollectionModule } from '../lib/einstein/data/collector';

describe('DataCollectionModule', () => {
  let collector: DataCollectionModule;
  
  beforeEach(() => {
    collector = new DataCollectionModule();
  });
  
  test('fetchMarketData returns valid data', async () => {
    const data = await collector.fetchMarketData('BTC');
    
    expect(data).toBeDefined();
    expect(data.price).toBeGreaterThan(0);
    expect(data.volume).toBeGreaterThan(0);
    expect(data.marketCap).toBeGreaterThan(0);
  });
  
  test('validateAllData enforces 90% minimum quality', () => {
    const data = {
      market: { price: 95000 },
      sentiment: null, // Missing
      onChain: { whaleTransactions: [] },
      technical: { rsi: 65 }
    };
    
    const quality = collector.validateAllData(data);
    
    expect(quality.score).toBeLessThan(90);
  });
});
```

**Integration Test Example**:

```typescript
import { EinsteinEngineCoordinator } from '../lib/einstein/coordinator/engine';

describe('Einstein Engine Integration', () => {
  test('generates complete trade signal', async () => {
    const coordinator = new EinsteinEngineCoordinator();
    
    const signal = await coordinator.generateTradeSignal('BTC', '1h');
    
    expect(signal).toBeDefined();
    expect(signal.positionType).toMatch(/LONG|SHORT|NO_TRADE/);
    expect(signal.confidenceScore).toBeGreaterThanOrEqual(60);
    expect(signal.dataQualityScore).toBeGreaterThanOrEqual(90);
    expect(signal.entryPrice).toBeGreaterThan(0);
    expect(signal.stopLoss).toBeGreaterThan(0);
    expect(signal.takeProfit1).toBeGreaterThan(signal.entryPrice);
  }, 30000); // 30s timeout
});
```

---

## Deployment

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
COINMARKETCAP_API_KEY=...
NEWS_API_KEY=...
LUNARCRUSH_API_KEY=...
DATABASE_URL=postgres://...
JWT_SECRET=...

# Optional
COINGECKO_API_KEY=...
TWITTER_BEARER_TOKEN=...
REDDIT_CLIENT_ID=...
```

### Database Migrations

```bash
# Run migrations
npx tsx scripts/run-migrations.ts

# Verify migrations
psql $DATABASE_URL -c "SELECT * FROM einstein_trade_signals LIMIT 1;"
```

### Vercel Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Check deployment status
vercel ls
```

### Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] API keys configured
- [ ] Performance tests passing
- [ ] Security tests passing
- [ ] User guide published
- [ ] Monitoring enabled

---

## Contributing

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Follow existing patterns
- Add JSDoc comments
- Write tests for new features

### Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Testing Requirements

- All tests must pass
- Code coverage ≥80%
- Performance tests must pass
- Security tests must pass

---

## Support

- **Documentation**: This guide + User Guide
- **Issues**: GitHub Issues
- **Email**: dev@bitcoinsovereign.tech
- **Discord**: #einstein-dev channel

---

**Version**: 2.0.0  
**Last Updated**: January 27, 2025  
**Status**: Production Ready ✅
