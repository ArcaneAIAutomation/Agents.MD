# UCIE Developer Documentation

## Universal Crypto Intelligence Engine - Technical Reference

Complete technical documentation for developers working with or extending the Universal Crypto Intelligence Engine.

**Version**: 1.0.0  
**Last Updated**: January 2025

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Reference](#api-reference)
3. [Data Models](#data-models)
4. [Component Library](#component-library)
5. [Utility Functions](#utility-functions)
6. [Hooks](#hooks)
7. [Caching Strategy](#caching-strategy)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Contributing](#contributing)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Search Page  │  │ Analysis Hub │  │ Export       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                          │
│  /api/ucie/analyze/[symbol]  - Main analysis endpoint           │
│  /api/ucie/search            - Token search                     │
│  /api/ucie/export            - Report generation                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer (lib/ucie/)                        │
│  • Market data clients  • Technical indicators                  │
│  • On-chain analytics   • Social sentiment                      │
│  • News aggregation     • Risk assessment                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External APIs (15+ sources)                   │
│  Caesar • CoinGecko • CMC • Etherscan • LunarCrush • Twitter   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript 5.2
- **Styling**: Tailwind CSS (Bitcoin Sovereign design)
- **State Management**: React Query
- **Caching**: Redis (Upstash) + Database
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI GPT-4o, Caesar AI, Gemini

---

## API Reference

### Main Analysis Endpoint

**GET** `/api/ucie/analyze/[symbol]`

Performs comprehensive analysis on a cryptocurrency token.

**Parameters:**
- `symbol` (path): Token symbol (e.g., "BTC", "ETH")

**Query Parameters:**
- `refresh` (optional): Force cache refresh (boolean)
- `sections` (optional): Comma-separated list of sections to include

**Response:**
```typescript
{
  symbol: string;
  timestamp: string;
  dataQualityScore: number;
  marketData: { ... };
  research: { ... };
  onChain: { ... };
  sentiment: { ... };
  news: { ... };
  technical: { ... };
  predictions: { ... };
  risk: { ... };
  derivatives: { ... };
  defi: { ... };
  consensus: { ... };
  executiveSummary: { ... };
}
```

**Example:**
```bash
curl https://news.arcane.group/api/ucie/analyze/BTC
```

### Search Endpoint

**GET** `/api/ucie/search`

Search for tokens with autocomplete.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Max results (default: 10)

**Response:**
```typescript
{
  results: Array<{
    symbol: string;
    name: string;
    rank: number;
    marketCap: number;
  }>;
}
```

**Example:**
```bash
curl https://news.arcane.group/api/ucie/search?q=bitcoin
```

### Health Check Endpoint

**GET** `/api/ucie/health`

Check UCIE system health and API status.

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  apis: {
    [apiName: string]: 'configured' | 'missing' | 'error';
  };
  cache: {
    redis: boolean;
    database: boolean;
  };
}
```

### Export Endpoint

**POST** `/api/ucie/export`

Generate and export analysis report.

**Body:**
```typescript
{
  symbol: string;
  format: 'pdf' | 'json' | 'markdown';
  sections?: string[];
  includeCharts?: boolean;
}
```

**Response:**
- PDF: Binary file download
- JSON: JSON object
- Markdown: Text file download

---

## Data Models

### ComprehensiveAnalysis

Main data structure for complete token analysis.

```typescript
interface ComprehensiveAnalysis {
  symbol: string;
  timestamp: string;
  dataQualityScore: number;
  
  marketData: MarketData;
  research: CaesarResearch;
  onChain: OnChainAnalytics;
  sentiment: SocialSentiment;
  news: NewsIntelligence;
  technical: TechnicalAnalysis;
  predictions: PredictiveModels;
  risk: RiskAssessment;
  derivatives: DerivativesData;
  defi: DeFiMetrics;
  consensus: ConsensusSignal;
  executiveSummary: ExecutiveSummary;
}
```

### MarketData

```typescript
interface MarketData {
  prices: {
    [exchange: string]: number;
  };
  vwap: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  change24h: number;
  change7d: number;
  change30d: number;
  arbitrageOpportunities: ArbitrageOpportunity[];
}
```

### TechnicalAnalysis

```typescript
interface TechnicalAnalysis {
  indicators: {
    rsi: { value: number; signal: string; interpretation: string };
    macd: { value: number; signal: string; interpretation: string };
    bollingerBands: { upper: number; middle: number; lower: number };
    ema: { ema9: number; ema21: number; ema50: number; ema200: number };
    // ... more indicators
  };
  multiTimeframeConsensus: {
    '15m': 'buy' | 'sell' | 'neutral';
    '1h': 'buy' | 'sell' | 'neutral';
    '4h': 'buy' | 'sell' | 'neutral';
    '1d': 'buy' | 'sell' | 'neutral';
    '1w': 'buy' | 'sell' | 'neutral';
    overall: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  };
  supportResistance: PriceLevel[];
  patterns: ChartPattern[];
}
```

### ConsensusSignal

```typescript
interface ConsensusSignal {
  overallScore: number; // 0-100
  shortTerm: { score: number; signal: string; confidence: number };
  mediumTerm: { score: number; signal: string; confidence: number };
  longTerm: { score: number; signal: string; confidence: number };
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  keyFactors: string[];
  conflicts: string[];
}
```

---

## Component Library

### UCIESearchBar

Token search component with autocomplete.

```typescript
import { UCIESearchBar } from '@/components/UCIE/UCIESearchBar';

<UCIESearchBar
  onTokenSelect={(symbol) => router.push(`/ucie/analyze/${symbol}`)}
  recentSearches={['BTC', 'ETH', 'SOL']}
  popularTokens={['BTC', 'ETH', 'BNB', 'XRP']}
/>
```

**Props:**
- `onTokenSelect`: Callback when token is selected
- `recentSearches`: Array of recent search symbols
- `popularTokens`: Array of popular token symbols

### UCIEAnalysisHub

Main analysis dashboard component.

```typescript
import { UCIEAnalysisHub } from '@/components/UCIE/UCIEAnalysisHub';

<UCIEAnalysisHub
  symbol="BTC"
  analysisData={data}
  loading={false}
  error={null}
/>
```

**Props:**
- `symbol`: Token symbol
- `analysisData`: Complete analysis data
- `loading`: Loading state
- `error`: Error object if any

### MarketDataPanel

Displays market data section.

```typescript
import { MarketDataPanel } from '@/components/UCIE/MarketDataPanel';

<MarketDataPanel
  symbol="BTC"
  data={marketData}
  refreshInterval={30000}
/>
```

### TechnicalAnalysisPanel

Displays technical analysis section.

```typescript
import { TechnicalAnalysisPanel } from '@/components/UCIE/TechnicalAnalysisPanel';

<TechnicalAnalysisPanel
  symbol="BTC"
  indicators={technicalData.indicators}
  signals={technicalData.signals}
  patterns={technicalData.patterns}
/>
```

---

## Utility Functions

### Market Data

```typescript
// lib/ucie/marketDataClients.ts

export async function fetchCoinGeckoPrice(symbol: string): Promise<number>;
export async function fetchCoinMarketCapData(symbol: string): Promise<MarketData>;
export async function aggregatePrices(symbol: string): Promise<MultiExchangePriceData>;
```

### Technical Indicators

```typescript
// lib/ucie/technicalIndicators.ts

export function calculateRSI(prices: number[], period: number = 14): number;
export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number };
export function calculateBollingerBands(prices: number[], period: number = 20): { upper: number; middle: number; lower: number };
export function calculateEMA(prices: number[], period: number): number;
```

### Risk Assessment

```typescript
// lib/ucie/riskScoring.ts

export function calculateVolatility(prices: number[]): number;
export function calculateMaxDrawdown(prices: number[]): number;
export function calculateRiskScore(data: RiskData): number;
```

### Caching

```typescript
// lib/ucie/cache.ts

export async function getCachedAnalysis(symbol: string): Promise<ComprehensiveAnalysis | null>;
export async function setCachedAnalysis(symbol: string, data: ComprehensiveAnalysis, ttl: number): Promise<void>;
export async function invalidateCache(symbol: string): Promise<void>;
```

---

## Hooks

### useUCIEAnalysis

Main hook for fetching and managing analysis data.

```typescript
import { useUCIEAnalysis } from '@/hooks/useUCIEAnalysis';

const { data, loading, error, refetch } = useUCIEAnalysis('BTC', {
  refreshInterval: 30000,
  enabled: true,
});
```

**Options:**
- `refreshInterval`: Auto-refresh interval (ms)
- `enabled`: Enable/disable fetching
- `onSuccess`: Success callback
- `onError`: Error callback

### useUCIESearch

Hook for token search with autocomplete.

```typescript
import { useUCIESearch } from '@/hooks/useUCIESearch';

const { results, loading, search } = useUCIESearch();

// Usage
search('bitcoin');
```

### useUCIEWatchlist

Hook for managing user watchlist.

```typescript
import { useUCIEWatchlist } from '@/hooks/useUCIEWatchlist';

const { watchlist, addToWatchlist, removeFromWatchlist } = useUCIEWatchlist();

// Usage
addToWatchlist('BTC');
removeFromWatchlist('ETH');
```

### useUCIEAlerts

Hook for managing user alerts.

```typescript
import { useUCIEAlerts } from '@/hooks/useUCIEAlerts';

const { alerts, createAlert, deleteAlert, toggleAlert } = useUCIEAlerts();

// Usage
createAlert({
  symbol: 'BTC',
  type: 'price_above',
  threshold: 100000,
});
```

---

## Caching Strategy

### Multi-Level Cache

UCIE uses a three-tier caching strategy:

**Level 1: Memory Cache (30 seconds)**
- Fastest access
- In-memory Map
- Cleared on server restart

**Level 2: Redis Cache (5 minutes)**
- Fast distributed cache
- Shared across instances
- Automatic expiration

**Level 3: Database Cache (1 hour)**
- Persistent storage
- Survives restarts
- Manual invalidation

### Cache Keys

```typescript
// Format: ucie:{type}:{symbol}:{variant}
'ucie:analysis:BTC:full'
'ucie:market:ETH:price'
'ucie:technical:SOL:indicators'
```

### Cache TTL Values

```typescript
export const CACHE_TTL = {
  MARKET_DATA: 30,        // 30 seconds
  TECHNICAL: 60,          // 1 minute
  NEWS: 300,              // 5 minutes
  SENTIMENT: 300,         // 5 minutes
  ON_CHAIN: 300,          // 5 minutes
  DERIVATIVES: 300,       // 5 minutes
  DEFI: 3600,             // 1 hour
  RESEARCH: 86400,        // 24 hours
  PREDICTIONS: 3600,      // 1 hour
  RISK: 3600,             // 1 hour
};
```

### Cache Invalidation

```typescript
// Manual invalidation
await invalidateCache('BTC');

// Automatic invalidation on TTL expiry
// Handled by Redis/Database

// Force refresh
const data = await fetchAnalysis('BTC', { refresh: true });
```

---

## Error Handling

### Error Types

```typescript
export class UCIEError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'UCIEError';
  }
}

// Error codes
export const ERROR_CODES = {
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_TIMEOUT: 'API_TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
  CACHE_ERROR: 'CACHE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
};
```

### Error Handling Pattern

```typescript
try {
  const data = await fetchAnalysis(symbol);
  return data;
} catch (error) {
  if (error instanceof UCIEError) {
    // Handle known errors
    switch (error.code) {
      case ERROR_CODES.TOKEN_NOT_FOUND:
        return { error: 'Token not found', suggestions: [] };
      case ERROR_CODES.API_RATE_LIMIT:
        return { error: 'Rate limit exceeded', retryAfter: 60 };
      default:
        return { error: 'Unknown error' };
    }
  }
  
  // Handle unknown errors
  Sentry.captureException(error);
  return { error: 'Internal server error' };
}
```

### Fallback Strategy

```typescript
async function fetchWithFallback(
  primary: () => Promise<any>,
  fallback: () => Promise<any>
): Promise<any> {
  try {
    return await primary();
  } catch (error) {
    console.warn('Primary source failed, using fallback');
    return await fallback();
  }
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/ucie/technicalIndicators.test.ts

import { calculateRSI, calculateMACD } from '@/lib/ucie/technicalIndicators';

describe('Technical Indicators', () => {
  test('calculateRSI returns value between 0 and 100', () => {
    const prices = [100, 102, 101, 103, 105, 104, 106];
    const rsi = calculateRSI(prices);
    expect(rsi).toBeGreaterThanOrEqual(0);
    expect(rsi).toBeLessThanOrEqual(100);
  });

  test('calculateMACD returns correct structure', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
    const macd = calculateMACD(prices);
    expect(macd).toHaveProperty('macd');
    expect(macd).toHaveProperty('signal');
    expect(macd).toHaveProperty('histogram');
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/ucie/analysis.test.ts

import { fetchAnalysis } from '@/lib/ucie/analysis';

describe('UCIE Analysis Integration', () => {
  test('fetchAnalysis returns complete data for BTC', async () => {
    const data = await fetchAnalysis('BTC');
    
    expect(data).toHaveProperty('symbol', 'BTC');
    expect(data).toHaveProperty('marketData');
    expect(data).toHaveProperty('technical');
    expect(data).toHaveProperty('consensus');
    expect(data.dataQualityScore).toBeGreaterThan(80);
  }, 30000);
});
```

### Security Tests

```typescript
// __tests__/security/ucie-security.test.ts

describe('UCIE Security', () => {
  test('prevents SQL injection in symbol parameter', async () => {
    const maliciousInput = "BTC'; DROP TABLE users; --";
    const response = await fetch(`/api/ucie/analyze/${maliciousInput}`);
    expect(response.status).toBe(400);
  });

  test('API keys not exposed in client', () => {
    const html = document.documentElement.innerHTML;
    expect(html).not.toContain(process.env.ETHERSCAN_API_KEY);
    expect(html).not.toContain(process.env.CAESAR_API_KEY);
  });
});
```

---

## Contributing

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Configure API keys
5. Run development server: `npm run dev`

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Write JSDoc comments for public functions
- Follow Bitcoin Sovereign design system

### Pull Request Process

1. Create feature branch: `git checkout -b feature/ucie-new-feature`
2. Make changes and commit
3. Write tests for new functionality
4. Run tests: `npm test`
5. Push and create PR
6. Wait for review and CI checks

### Testing Requirements

- All new features must have unit tests
- Integration tests for API endpoints
- Security tests for user input
- Performance tests for critical paths

---

## API Rate Limits

### External API Limits

| API | Free Tier | Rate Limit | Cost |
|-----|-----------|------------|------|
| Etherscan | 100k calls/day | 5 calls/sec | Free |
| LunarCrush | 50 calls/day | N/A | $49/month Pro |
| Twitter | 500k tweets/month | N/A | $100/month |
| CoinGlass | Unlimited | 100 calls/min | Free |
| Caesar AI | Pay per use | N/A | ~$0.02/analysis |

### Internal Rate Limits

- Analysis endpoint: 10 requests/minute per user
- Search endpoint: 60 requests/minute per user
- Export endpoint: 5 requests/minute per user

---

## Performance Targets

### Response Times

- Search autocomplete: < 100ms
- Market data: < 1s
- Complete analysis: < 15s
- Export generation: < 5s

### Caching

- Cache hit rate: > 80%
- Cache response time: < 50ms
- Database query time: < 100ms

### Availability

- Uptime: 99.9%
- Error rate: < 1%
- Data quality score: > 90%

---

## Support

### Documentation

- User Guide: `UCIE-USER-GUIDE.md`
- Deployment Guide: `UCIE-PRODUCTION-DEPLOYMENT.md`
- Monitoring Setup: `UCIE-MONITORING-SETUP.md`

### Contact

- Email: dev@arcane.group
- GitHub: github.com/ArcaneAIAutomation/Agents.MD
- Discord: [Join our community]

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Bitcoin Sovereign Technology Team
