# UCIE Error Handling & Logging Infrastructure

## Overview

The UCIE error handling system provides comprehensive error management with multi-source fallback, graceful degradation, and user-friendly error messages. This infrastructure ensures the application remains functional even when some data sources fail.

## Components

### 1. Error Logger (`errorLogger.ts`)

Centralized error logging with Sentry integration and structured error tracking.

**Features:**
- Structured error logging with severity levels
- Error categorization (API, network, validation, etc.)
- Sentry integration (optional)
- Local storage error history
- User-friendly error messages
- Context capture for debugging

**Usage:**

```typescript
import { logError, logApiError, logDataQualityIssue } from './errorLogger';

// Log general error
logError(error, {
  source: 'market_data',
  symbol: 'BTC',
  critical: false
});

// Log API error
logApiError(error, 'CoinGecko', '/simple/price', 'BTC');

// Log data quality issue
logDataQualityIssue(
  'Price discrepancy detected',
  ['CoinGecko', 'CoinMarketCap'],
  2.5, // 2.5% discrepancy
  'BTC'
);
```

**Error Severity Levels:**
- `low`: Non-critical errors, doesn't affect core functionality
- `medium`: Secondary API failures, fallback available
- `high`: Primary API failures, affects important features
- `critical`: Database/auth errors, prevents core functionality

**Error Categories:**
- `api_error`: External API failures
- `network_error`: Network connectivity issues
- `validation_error`: Input validation failures
- `rate_limit_error`: API rate limit exceeded
- `timeout_error`: Request timeout
- `data_quality_error`: Data discrepancies detected
- `cache_error`: Cache operation failures
- `unknown_error`: Unclassified errors

### 2. Fallback System (`fallbackSystem.ts`)

Intelligent multi-source fallback with automatic source prioritization.

**Features:**
- Priority-based source selection
- Automatic fallback on failure
- Source health tracking
- Timeout management
- Data quality scoring
- Multi-source comparison

**Usage:**

```typescript
import { fetchWithFallback, fetchAndCompare } from './fallbackSystem';

// Define data sources
const sources = [
  {
    name: 'CoinGecko',
    priority: 1, // Highest priority
    fetch: () => fetchFromCoinGecko(symbol),
    timeout: 5000,
    healthScore: 100
  },
  {
    name: 'CoinMarketCap',
    priority: 2, // Fallback
    fetch: () => fetchFromCoinMarketCap(symbol),
    timeout: 5000,
    healthScore: 100
  }
];

// Fetch with automatic fallback
const result = await fetchWithFallback(sources, symbol);
console.log(`Data from: ${result.source}`);
console.log(`Quality: ${result.quality}%`);
console.log(`Is fallback: ${result.isFallback}`);

// Fetch and compare multiple sources
const compareResult = await fetchAndCompare(
  sources,
  (a, b) => Math.abs((a.price - b.price) / a.price) * 100, // Compare prices
  2, // Max 2% discrepancy
  symbol
);
```

**Source Health Tracking:**

The system automatically tracks source health based on success/failure:
- Success: +5 points (max 100)
- Failure: -20 points (min 0)
- Sources with low health are deprioritized

```typescript
import { getSourceHealth, getAllHealthScores } from './fallbackSystem';

// Get health of specific source
const health = getSourceHealth('CoinGecko'); // 0-100

// Get all health scores
const allScores = getAllHealthScores();
// { CoinGecko: 100, CoinMarketCap: 80, ... }
```

### 3. Graceful Degradation (`gracefulDegradation.ts`)

Handles partial failures and provides fallback strategies.

**Features:**
- Degradation level detection
- Feature availability tracking
- Partial data handling
- Cached data fallback
- Static fallback data
- Data quality calculation

**Usage:**

```typescript
import {
  getDegradationStatus,
  handlePartialFailure,
  getCachedFallback,
  createDegradedResponse
} from './gracefulDegradation';

// Check degradation status
const status = getDegradationStatus(
  ['market_data', 'news_data'], // Available sources
  ['market_data', 'news_data', 'social_data', 'blockchain_data'], // Total sources
  { market_data: 95, news_data: 80 } // Source qualities
);

console.log(status.level); // 'full' | 'partial' | 'minimal' | 'offline'
console.log(status.availableFeatures); // ['price_display', 'news_feed']
console.log(status.unavailableFeatures); // ['sentiment_analysis', 'on_chain_analysis']
console.log(status.dataQuality); // 0-100

// Handle partial failures
const results = await Promise.allSettled([
  fetchMarketData(),
  fetchSocialData(),
  fetchNewsData()
]);

const { successful, failed, dataQuality } = handlePartialFailure(results, {
  source: 'data_aggregation',
  symbol: 'BTC'
});

// Use cached fallback
const cachedData = await getCachedFallback('market_data_BTC', 3600000); // 1 hour max age

// Create degraded response
const response = createDegradedResponse(
  partialData,
  cachedData,
  staticData,
  status
);
```

**Degradation Levels:**
- `full`: 90%+ sources available, all features work
- `partial`: 60-90% sources available, some features limited
- `minimal`: 30-60% sources available, basic features only
- `offline`: <30% sources available, cached data only

### 4. Error Boundary Component (`ErrorBoundary.tsx`)

React error boundary for catching component errors.

**Features:**
- Catches React component errors
- Logs errors to monitoring service
- Displays user-friendly error UI
- Provides recovery actions
- Bitcoin Sovereign styling

**Usage:**

```typescript
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

// Wrap components
function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}

// Or use HOC
const SafeComponent = withErrorBoundary(YourComponent);

// Custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>

// Custom error handler
<ErrorBoundary onError={(error, errorInfo) => {
  console.log('Error caught:', error);
}}>
  <YourComponent />
</ErrorBoundary>
```

### 5. Error Message Components (`ErrorMessage.tsx`)

User-friendly error message components with Bitcoin Sovereign styling.

**Components:**
- `ErrorMessage`: Full error card with details
- `InlineErrorMessage`: Compact inline error
- `ErrorToast`: Toast notification

**Usage:**

```typescript
import { ErrorMessage, InlineErrorMessage, ErrorToast } from './ErrorMessage';

// Full error message
<ErrorMessage
  type="api_error"
  title="Service Unavailable"
  message="Unable to fetch market data"
  onRetry={() => refetch()}
  onDismiss={() => setError(null)}
  showDetails={true}
  details={error.stack}
/>

// Inline error
<InlineErrorMessage
  message="Failed to load data"
  onRetry={() => refetch()}
/>

// Toast notification
{showToast && (
  <ErrorToast
    message="Connection error"
    onDismiss={() => setShowToast(false)}
    duration={5000}
  />
)}
```

## Integration Examples

### Example 1: API Call with Fallback

```typescript
import { fetchWithFallback } from './fallbackSystem';
import { logApiError } from './errorLogger';

async function fetchMarketData(symbol: string) {
  const sources = [
    {
      name: 'CoinGecko',
      priority: 1,
      fetch: async () => {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
        if (!response.ok) throw new Error('CoinGecko API error');
        return response.json();
      },
      timeout: 5000,
      healthScore: 100
    },
    {
      name: 'CoinMarketCap',
      priority: 2,
      fetch: async () => {
        const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`);
        if (!response.ok) throw new Error('CoinMarketCap API error');
        return response.json();
      },
      timeout: 5000,
      healthScore: 100
    }
  ];

  try {
    const result = await fetchWithFallback(sources, symbol);
    return {
      data: result.data,
      metadata: {
        source: result.source,
        quality: result.quality,
        isFallback: result.isFallback
      }
    };
  } catch (error) {
    logApiError(error as Error, 'market_data', 'fetchMarketData', symbol);
    throw error;
  }
}
```

### Example 2: Component with Error Handling

```typescript
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorMessage } from './ErrorMessage';
import { getCachedFallback, setCachedFallback } from './gracefulDegradation';

function MarketDataPanel({ symbol }: { symbol: string }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch fresh data
      const result = await fetchMarketData(symbol);
      setData(result.data);
      
      // Cache for fallback
      setCachedFallback(`market_data_${symbol}`, result.data);
    } catch (err) {
      // Try cached data
      const cached = await getCachedFallback(`market_data_${symbol}`);
      if (cached) {
        setData(cached);
        setError({ type: 'cache_fallback', message: 'Using cached data' });
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  if (loading) return <LoadingSpinner />;
  
  if (error && !data) {
    return (
      <ErrorMessage
        type="api_error"
        message="Unable to fetch market data"
        onRetry={fetchData}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div>
        {error && (
          <InlineErrorMessage message="Using cached data" />
        )}
        <MarketDataDisplay data={data} />
      </div>
    </ErrorBoundary>
  );
}
```

### Example 3: Multi-Source Data Aggregation

```typescript
import { handlePartialFailure, getDegradationStatus } from './gracefulDegradation';

async function fetchComprehensiveAnalysis(symbol: string) {
  // Fetch from multiple sources in parallel
  const results = await Promise.allSettled([
    fetchMarketData(symbol),
    fetchSocialSentiment(symbol),
    fetchNewsData(symbol),
    fetchOnChainData(symbol),
    fetchTechnicalIndicators(symbol)
  ]);

  // Handle partial failures
  const { successful, failed, dataQuality } = handlePartialFailure(results, {
    source: 'comprehensive_analysis',
    symbol
  });

  // Determine degradation status
  const availableSources = successful.map((_, i) => 
    ['market_data', 'social_data', 'news_data', 'blockchain_data', 'technical_data'][i]
  );
  const totalSources = ['market_data', 'social_data', 'news_data', 'blockchain_data', 'technical_data'];
  
  const status = getDegradationStatus(availableSources, totalSources);

  return {
    data: {
      market: successful[0] || null,
      social: successful[1] || null,
      news: successful[2] || null,
      onChain: successful[3] || null,
      technical: successful[4] || null
    },
    metadata: {
      dataQuality,
      degradationStatus: status,
      failedSources: failed.length
    }
  };
}
```

## Sentry Integration

To enable Sentry error tracking:

1. Install Sentry:
```bash
npm install @sentry/nextjs
```

2. Initialize in `_app.tsx`:
```typescript
import { initializeSentry } from '../lib/ucie/errorLogger';

// In _app.tsx
useEffect(() => {
  initializeSentry(process.env.NEXT_PUBLIC_SENTRY_DSN);
}, []);
```

3. Add environment variable:
```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

## Best Practices

1. **Always use fallback system for external APIs**
   - Define multiple sources with priorities
   - Set appropriate timeouts
   - Track source health

2. **Log errors with context**
   - Include symbol, user ID, request ID
   - Specify error severity
   - Add relevant metadata

3. **Provide user-friendly messages**
   - Use ErrorMessage components
   - Offer retry actions
   - Show degradation status

4. **Handle partial failures gracefully**
   - Use Promise.allSettled for parallel requests
   - Merge partial data with fallbacks
   - Display data quality indicators

5. **Wrap components in Error Boundaries**
   - Catch React errors
   - Provide recovery actions
   - Log to monitoring service

6. **Cache data for offline fallback**
   - Cache successful responses
   - Set appropriate TTL
   - Use cached data when APIs fail

## Monitoring

### View Recent Errors

```typescript
import { getRecentErrors } from './errorLogger';

const errors = getRecentErrors(10); // Last 10 errors
console.table(errors);
```

### Check Source Health

```typescript
import { getAllHealthScores } from './fallbackSystem';

const health = getAllHealthScores();
console.log('Source Health:', health);
```

### Monitor Degradation

```typescript
import { getDegradationStatus } from './gracefulDegradation';

const status = getDegradationStatus(availableSources, totalSources);
console.log('System Status:', status.level);
console.log('Data Quality:', status.dataQuality);
```

## Requirements Coverage

This error handling infrastructure satisfies the following UCIE requirements:

- **Requirement 13.1**: Cross-reference data from multiple sources with discrepancy detection
- **Requirement 13.2**: Display data freshness timestamps and source attribution
- **Requirement 13.3**: Handle data source conflicts with consensus calculation
- **Requirement 13.4**: Maintain data quality scores based on source availability
- **Requirement 13.5**: Provide data sources section with API status

## Status

✅ **COMPLETE** - All error handling infrastructure implemented and ready for use.

---

**Last Updated**: January 2025
**Version**: 1.0.0
