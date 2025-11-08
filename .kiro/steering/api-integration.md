# API Integration Guidelines

## Multi-Source Data Strategy

**Current Status (November 2025)**: The platform uses multiple cryptocurrency data sources with intelligent fallback mechanisms and comprehensive API coverage.

#### Market Data APIs (✅ All Working)
- **CoinMarketCap API** - Primary market data source (paid plan)
- **CoinGecko API** - Secondary source with rate limiting
- **Kraken API** - Live trading data and order book analysis

#### News & Intelligence APIs (✅ All Working)
- **NewsAPI** - Real-time cryptocurrency news aggregation
- **Caesar API** - Advanced research and market intelligence
- **OpenAI GPT-4o** - AI-powered analysis and trade signal generation

#### Social Sentiment APIs (✅ All Working)
- **LunarCrush API** - Social metrics, sentiment, galaxy score
- **Twitter/X API** - Tweet analysis and influencer tracking
- **Reddit API** - Community sentiment analysis

#### DeFi APIs (✅ Working)
- **DeFiLlama API** - TVL data, protocol metrics (public API)

#### Blockchain APIs (✅ All Working + 🆕 Solana Added)
- **Etherscan API V2** - Ethereum blockchain data (migrated from V1)
- **BSCScan API V2** - Binance Smart Chain data
- **Polygonscan API V2** - Polygon network data
- **Blockchain.com API** - Bitcoin blockchain data
- **🆕 Solana RPC API** - Solana blockchain data (SOL and SPL tokens)

#### AI APIs (✅ All Working)
- **OpenAI GPT-4o** - Advanced market analysis
- **Gemini AI** - Fast whale transaction analysis

#### Derivatives APIs (⚠️ Limited)
- **CoinGlass API** - Requires paid plan upgrade (free tier exhausted)
- **Binance Futures** - Recommended fallback (public API)

## API Status Summary (January 2025)

### Working APIs: 14/15 (93.3%)
- ✅ Market Data: CoinMarketCap, CoinGecko, Kraken
- ✅ News: NewsAPI, Caesar API
- ✅ Social: LunarCrush, Twitter/X, Reddit
- ✅ DeFi: DeFiLlama
- ✅ Blockchain: Etherscan V2, Blockchain.com, Solana RPC
- ✅ AI: OpenAI, Gemini
- ❌ Derivatives: CoinGlass (requires upgrade)

### Recent Updates (January 2025)
- ✅ Etherscan migrated from V1 to V2 API (November 2025)
- ✅ DeFi endpoint fixed (removed undefined functions) (November 2025)
- ✅ Comprehensive API testing implemented (November 2025)
- 🆕 Solana RPC API integration added (January 2025)
- 🆕 Multi-provider Solana support (QuickNode, Alchemy, Helius) (January 2025)

## Caesar API Integration

### Available Endpoints

#### Market Data
```typescript
GET /api/caesar-market-data?symbol=BTC
// Returns: Real-time price, volume, market cap, technical indicators
```

#### Trade Signals
```typescript
GET /api/caesar-trade-signals?symbol=BTC
// Returns: AI-powered buy/sell signals with confidence scores
```

#### News & Sentiment
```typescript
GET /api/caesar-news?symbols=BTC,ETH&limit=15
// Returns: Cryptocurrency news with sentiment analysis
```

#### Whale Watch (✅ Live in Production)
```typescript
GET /api/whale-watch/detect?threshold=50
// Returns: List of large Bitcoin transactions above threshold

POST /api/whale-watch/analyze
// Body: { txHash, amount, fromAddress, toAddress, ... }
// Returns: { success, jobId } - Starts Caesar AI research job

GET /api/whale-watch/analysis/[jobId]
// Returns: { status, analysis, sources } - Poll for analysis results
```

#### Health Monitoring
```typescript
GET /api/caesar-health
// Returns: API status, latency, uptime
```

### Caesar API Client

```typescript
import {
  getCaesarMarketData,
  getCaesarTechnicalAnalysis,
  getCaesarTradeSignals,
  getCaesarNews,
  caesarHealthCheck
} from '../utils/caesarApi';
```

### React Hooks

```typescript
import {
  useCaesarMarketData,
  useCaesarTradeSignals,
  useCaesarNews,
  useCaesarHealth
} from '../hooks/useCaesarData';
```

### API Protection Patterns

#### Analysis Lock System (Whale Watch)
To prevent API spam from multiple simultaneous requests:

```typescript
// 1. Track active analysis state
const [analyzingTx, setAnalyzingTx] = useState<string | null>(null);
const hasActiveAnalysis = (
  whaleData?.whales.some(w => w.analysisStatus === 'analyzing') || 
  analyzingTx !== null
);

// 2. Guard clause at function start
const analyzeTransaction = async (whale: WhaleTransaction) => {
  // STOP execution if any analysis is active
  if (analyzingTx !== null || whaleData?.whales.some(w => w.analysisStatus === 'analyzing')) {
    console.log('⚠️ Analysis already in progress, ignoring click');
    return;
  }
  
  // 3. Immediately set state before API call
  setAnalyzingTx(whale.txHash);
  // Update status to 'analyzing' immediately
  // ... then make API call
};

// 4. Disable UI with pointer-events
<div 
  className={isDisabled ? 'pointer-events-none opacity-50' : ''}
  style={isDisabled ? { pointerEvents: 'none' } : undefined}
>
```

**Key Principles:**
- Guard clause prevents function execution
- Immediate state updates before async operations
- Pointer events disabled on UI elements
- Visual feedback (greyed out, disabled buttons)
- Clear user messaging about why actions are blocked

### Mobile-Optimized API Patterns

#### Request Optimization
```typescript
// Mobile-friendly timeout and retry logic
const fetchWithFallback = async (primaryUrl: string, fallbackUrl: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s mobile timeout
  
  try {
    const response = await fetch(primaryUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CryptoHerald/1.0' }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Primary API timeout, trying fallback...');
      return fetch(fallbackUrl, { signal: AbortSignal.timeout(10000) });
    }
    throw error;
  }
};
```

#### Data Caching Strategy
- **Client-side caching**: 30 seconds for market data, 5 minutes for news
- **Stale-while-revalidate**: Show cached data immediately, update in background
- **Mobile bandwidth consideration**: Compress responses, minimize payload size
- **Offline support**: Cache critical data for offline viewing

### Error Handling & Fallbacks

#### API Failure Hierarchy
1. **Primary Source**: CoinGecko/CoinMarketCap with full features
2. **Secondary Source**: Alternative API with reduced features
3. **Cached Data**: Last known good data with timestamp
4. **Fallback Content**: Static data with clear indicators

#### Mobile-Specific Error States
```typescript
interface APIErrorState {
  type: 'network' | 'timeout' | 'rateLimit' | 'serverError';
  source: string;
  retryable: boolean;
  fallbackAvailable: boolean;
  mobileOptimized: boolean;
}
```

### Rate Limiting & Performance

#### Request Management
- **Batch requests**: Combine multiple data points in single calls
- **Request queuing**: Prevent API spam on mobile networks
- **Exponential backoff**: Smart retry logic for failed requests
- **Connection awareness**: Adjust request frequency based on connection type

#### Mobile Performance Optimization
```typescript
// Adaptive request strategy based on connection
const getRequestStrategy = (connectionType: string) => {
  switch (connectionType) {
    case 'slow-2g':
      return { timeout: 30000, retries: 1, batchSize: 1 };
    case '2g':
      return { timeout: 20000, retries: 2, batchSize: 2 };
    case '3g':
      return { timeout: 15000, retries: 3, batchSize: 5 };
    default: // 4g, wifi
      return { timeout: 10000, retries: 3, batchSize: 10 };
  }
};
```

## Real-Time Data Integration

### WebSocket Connections (Future Enhancement)
- **Connection management**: Auto-reconnect with exponential backoff
- **Mobile battery optimization**: Reduce update frequency on low battery
- **Background sync**: Continue updates when app is backgrounded
- **Data compression**: Minimize bandwidth usage on mobile networks

### Polling Strategy
- **Adaptive intervals**: Faster updates on desktop, slower on mobile
- **Visibility API**: Pause updates when tab/app is not visible
- **Network-aware**: Adjust frequency based on connection quality
- **Battery-aware**: Reduce updates on low battery devices

## Data Validation & Quality

### Response Validation
```typescript
interface MarketDataResponse {
  price: number;
  change24h: number;
  volume: number;
  timestamp: string;
  source: string;
  confidence: number; // Data quality score
}

const validateMarketData = (data: any): MarketDataResponse | null => {
  if (!data || typeof data.price !== 'number' || data.price <= 0) {
    return null;
  }
  // Additional validation logic...
  return data as MarketDataResponse;
};
```

### Cross-Source Verification
- **Price deviation alerts**: Flag unusual price differences between sources
- **Timestamp validation**: Ensure data freshness across sources
- **Confidence scoring**: Rate data quality based on source reliability
- **Anomaly detection**: Identify and filter suspicious data points

## Solana Blockchain Integration (🆕 January 2025)

### Overview
Solana integration provides comprehensive on-chain analytics for SOL and SPL tokens, including:
- Real-time balance queries
- Transaction history and whale tracking
- Token account information
- Stake account data
- Validator information
- Program account analysis

### Solana RPC Providers

#### 1. Public RPC (Free - Good for Testing)
```typescript
const SOLANA_PUBLIC_RPC = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  
  rateLimit: '~100 requests per 10 seconds',
  reliability: 'Medium (can be slow during high traffic)',
  cost: 'Free',
  
  bestFor: 'Development and testing'
};
```

#### 2. QuickNode (Recommended for Production)
```typescript
const QUICKNODE_CONFIG = {
  endpoint: 'https://[your-endpoint].solana-mainnet.quiknode.pro/[token]/',
  
  freeTier: {
    requests: '100,000 per day',
    features: ['Full RPC access', 'WebSocket support', 'Archive data']
  },
  
  paidTier: {
    requests: 'Unlimited',
    features: ['Priority routing', 'Dedicated nodes', 'Enhanced support']
  },
  
  setup: [
    '1. Sign up at https://www.quicknode.com/',
    '2. Create a Solana endpoint',
    '3. Copy the HTTP Provider URL',
    '4. Add to SOLANA_RPC_URL environment variable'
  ],
  
  bestFor: 'Production applications with moderate traffic'
};
```

#### 3. Alchemy (Alternative)
```typescript
const ALCHEMY_CONFIG = {
  endpoint: 'https://solana-mainnet.g.alchemy.com/v2/[api-key]',
  
  freeTier: {
    computeUnits: '300M per month',
    features: ['Enhanced APIs', 'NFT API', 'Token API']
  },
  
  setup: [
    '1. Sign up at https://www.alchemy.com/',
    '2. Create a Solana app',
    '3. Copy the HTTPS URL',
    '4. Add to SOLANA_RPC_URL environment variable'
  ],
  
  bestFor: 'Applications needing enhanced APIs and NFT support'
};
```

#### 4. Helius (High-Performance)
```typescript
const HELIUS_CONFIG = {
  endpoint: 'https://rpc.helius.xyz/?api-key=[api-key]',
  
  freeTier: {
    requests: '100,000 per day',
    features: ['Enhanced RPC', 'Webhooks', 'DAS API']
  },
  
  setup: [
    '1. Sign up at https://www.helius.dev/',
    '2. Create an API key',
    '3. Copy the RPC URL',
    '4. Add to SOLANA_RPC_URL environment variable'
  ],
  
  bestFor: 'High-performance applications and DeFi protocols'
};
```

### Solana API Client Implementation

```typescript
// lib/solana/client.ts
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

interface SolanaConfig {
  rpcUrl: string;
  fallbackUrl?: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
  timeout?: number;
}

class SolanaClient {
  private connection: Connection;
  private fallbackConnection?: Connection;
  
  constructor(config: SolanaConfig) {
    this.connection = new Connection(
      config.rpcUrl,
      {
        commitment: config.commitment || 'confirmed',
        confirmTransactionInitialTimeout: config.timeout || 30000
      }
    );
    
    if (config.fallbackUrl) {
      this.fallbackConnection = new Connection(
        config.fallbackUrl,
        { commitment: config.commitment || 'confirmed' }
      );
    }
  }
  
  // Get SOL balance for an address
  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      if (this.fallbackConnection) {
        const publicKey = new PublicKey(address);
        const balance = await this.fallbackConnection.getBalance(publicKey);
        return balance / 1e9;
      }
      throw error;
    }
  }
  
  // Get transaction history
  async getTransactionHistory(
    address: string,
    limit: number = 10
  ): Promise<any[]> {
    const publicKey = new PublicKey(address);
    const signatures = await this.connection.getSignaturesForAddress(
      publicKey,
      { limit }
    );
    
    const transactions = await Promise.all(
      signatures.map(sig => 
        this.connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })
      )
    );
    
    return transactions.filter(tx => tx !== null);
  }
  
  // Get token accounts for an address
  async getTokenAccounts(address: string): Promise<any[]> {
    const publicKey = new PublicKey(address);
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    return tokenAccounts.value.map(account => ({
      mint: account.account.data.parsed.info.mint,
      balance: account.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals
    }));
  }
  
  // Detect whale transactions (>100 SOL)
  async detectWhaleTransactions(
    address: string,
    threshold: number = 100
  ): Promise<any[]> {
    const transactions = await this.getTransactionHistory(address, 50);
    
    return transactions.filter(tx => {
      if (!tx?.meta) return false;
      
      const preBalance = tx.meta.preBalances[0] / 1e9;
      const postBalance = tx.meta.postBalances[0] / 1e9;
      const amount = Math.abs(postBalance - preBalance);
      
      return amount >= threshold;
    });
  }
}

// Export singleton instance
export const solanaClient = new SolanaClient({
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  fallbackUrl: process.env.SOLANA_RPC_FALLBACK_URL,
  commitment: (process.env.SOLANA_COMMITMENT as any) || 'confirmed',
  timeout: parseInt(process.env.SOLANA_RPC_TIMEOUT_MS || '30000')
});
```

### UCIE Integration for Solana

```typescript
// pages/api/ucie/on-chain/[symbol].ts
import { solanaClient } from '../../../../lib/solana/client';

export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // Check if this is a Solana token
  if (symbol.toUpperCase() === 'SOL') {
    try {
      // Get Solana-specific on-chain data
      const onChainData = await getSolanaOnChainData();
      
      return res.status(200).json({
        success: true,
        data: onChainData,
        source: 'solana-rpc'
      });
    } catch (error) {
      console.error('Solana on-chain error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch Solana on-chain data'
      });
    }
  }
  
  // Handle other blockchains (Ethereum, BSC, etc.)
  // ... existing code
}

async function getSolanaOnChainData() {
  // Example: Get data for a known Solana whale address
  const whaleAddress = 'YOUR_WHALE_ADDRESS_HERE';
  
  const [balance, transactions, tokenAccounts] = await Promise.all([
    solanaClient.getBalance(whaleAddress),
    solanaClient.getTransactionHistory(whaleAddress, 20),
    solanaClient.getTokenAccounts(whaleAddress)
  ]);
  
  return {
    blockchain: 'solana',
    whaleActivity: {
      address: whaleAddress,
      balance: balance,
      recentTransactions: transactions.length,
      tokenHoldings: tokenAccounts.length
    },
    // Add more Solana-specific metrics
  };
}
```

### Solana Whale Watch Integration

```typescript
// Extend Whale Watch to support Solana transactions
interface SolanaWhaleTransaction {
  signature: string;
  blockTime: number;
  slot: number;
  amount: number;
  fromAddress: string;
  toAddress: string;
  fee: number;
  status: 'success' | 'failed';
}

async function detectSolanaWhales(threshold: number = 100): Promise<SolanaWhaleTransaction[]> {
  // Monitor recent blocks for large transactions
  const recentSlot = await solanaClient.connection.getSlot();
  const block = await solanaClient.connection.getBlock(recentSlot, {
    maxSupportedTransactionVersion: 0
  });
  
  if (!block) return [];
  
  const whaleTransactions: SolanaWhaleTransaction[] = [];
  
  for (const tx of block.transactions) {
    if (!tx.meta) continue;
    
    const preBalance = tx.meta.preBalances[0] / 1e9;
    const postBalance = tx.meta.postBalances[0] / 1e9;
    const amount = Math.abs(postBalance - preBalance);
    
    if (amount >= threshold) {
      whaleTransactions.push({
        signature: tx.transaction.signatures[0],
        blockTime: block.blockTime || 0,
        slot: recentSlot,
        amount: amount,
        fromAddress: tx.transaction.message.accountKeys[0].toString(),
        toAddress: tx.transaction.message.accountKeys[1]?.toString() || 'unknown',
        fee: tx.meta.fee / 1e9,
        status: tx.meta.err ? 'failed' : 'success'
      });
    }
  }
  
  return whaleTransactions;
}
```

### Environment Variables Setup

```bash
# Add to .env.local
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_FALLBACK_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
SOLANA_COMMITMENT=confirmed
SOLANA_RPC_TIMEOUT_MS=30000

# Optional: Solscan API for enhanced data
SOLSCAN_API_KEY=your_solscan_api_key_here
```

### Testing Solana Integration

```typescript
// Test script: scripts/test-solana-api.ts
import { solanaClient } from '../lib/solana/client';

async function testSolanaIntegration() {
  console.log('🧪 Testing Solana RPC Integration...\n');
  
  try {
    // Test 1: Get cluster version
    const version = await solanaClient.connection.getVersion();
    console.log('✅ Solana RPC connected');
    console.log(`   Version: ${version['solana-core']}\n`);
    
    // Test 2: Get recent blockhash
    const { blockhash } = await solanaClient.connection.getLatestBlockhash();
    console.log('✅ Recent blockhash retrieved');
    console.log(`   Blockhash: ${blockhash.substring(0, 20)}...\n`);
    
    // Test 3: Get balance for a known address
    const testAddress = 'YOUR_TEST_ADDRESS';
    const balance = await solanaClient.getBalance(testAddress);
    console.log('✅ Balance query successful');
    console.log(`   Balance: ${balance} SOL\n`);
    
    console.log('🎉 All Solana tests passed!');
  } catch (error) {
    console.error('❌ Solana test failed:', error);
  }
}

testSolanaIntegration();
```

### Rate Limiting and Best Practices

```typescript
// Implement rate limiting for Solana RPC calls
import { RateLimiter } from 'limiter';

const solanaRateLimiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 10000 // 100 requests per 10 seconds
});

async function rateLimitedSolanaCall<T>(
  fn: () => Promise<T>
): Promise<T> {
  await solanaRateLimiter.removeTokens(1);
  return fn();
}

// Usage
const balance = await rateLimitedSolanaCall(() =>
  solanaClient.getBalance(address)
);
```

### Caching Strategy for Solana Data

```typescript
// Cache Solana data to reduce RPC calls
const solanaCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

async function getCachedSolanaData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = solanaCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetcher();
  solanaCache.set(key, { data, timestamp: Date.now() });
  
  return data;
}

// Usage
const balance = await getCachedSolanaData(
  `balance:${address}`,
  () => solanaClient.getBalance(address)
);
```

## Security & API Key Management

### Environment Configuration
```bash
# Production API Keys (Vercel Environment Variables)
OPENAI_API_KEY=sk-...
COINMARKETCAP_API_KEY=...
NEWS_API_KEY=...
COINGECKO_API_KEY=... # Optional, for rate limit increases

# Solana Configuration
SOLANA_RPC_URL=https://your-quicknode-endpoint.solana-mainnet.quiknode.pro/token/
SOLANA_RPC_FALLBACK_URL=https://api.mainnet-beta.solana.com
SOLSCAN_API_KEY=... # Optional

# Development Fallbacks
DEVELOPMENT_MODE=true
MOCK_API_RESPONSES=false
```

### Request Security
- **API key rotation**: Regular key updates for production
- **Rate limit monitoring**: Track usage across all endpoints
- **Request signing**: HMAC signatures for sensitive endpoints
- **IP whitelisting**: Restrict API access to known sources

## Mobile-Specific API Considerations

### Bandwidth Optimization
- **Response compression**: Gzip/Brotli compression enabled
- **Field selection**: Request only needed data fields
- **Image optimization**: Responsive images with multiple formats
- **Lazy loading**: Load non-critical data after initial render

### Offline Capabilities
- **Service worker**: Cache API responses for offline access
- **Background sync**: Queue requests when offline, sync when online
- **Critical data priority**: Ensure essential data is always cached
- **Offline indicators**: Clear UI feedback for offline state

### Progressive Enhancement
- **Core functionality**: Basic price display without JavaScript
- **Enhanced features**: Real-time updates, charts, advanced analysis
- **Graceful degradation**: Fallback to static data when APIs fail
- **Performance budgets**: Monitor and limit API request overhead

## Monitoring & Analytics

### API Health Monitoring
```typescript
interface APIHealthMetrics {
  endpoint: string;
  responseTime: number;
  successRate: number;
  errorRate: number;
  lastSuccess: string;
  mobilePerformance: {
    averageResponseTime: number;
    timeoutRate: number;
    retryRate: number;
  };
}
```

### Performance Tracking
- **Response times**: Track API latency across different networks
- **Success rates**: Monitor API reliability and uptime
- **Error categorization**: Classify and track different error types
- **Mobile metrics**: Specific tracking for mobile device performance

### User Experience Metrics
- **Time to first data**: How quickly users see initial content
- **Interactive readiness**: When users can interact with data
- **Error recovery time**: How quickly the app recovers from API failures
- **Offline experience**: Quality of offline functionality