# Veritas Protocol - API Schema Validation

This directory contains Zod validation schemas for all external APIs used in the UCIE Veritas Protocol.

## Overview

The Veritas Protocol uses runtime validation to ensure data integrity from external API sources. All API responses are validated using Zod schemas before being processed, preventing invalid or malicious data from entering the system.

## Available Schemas

### 1. CoinGecko Market Data
```typescript
import { CoinGeckoMarketDataSchema, fetchWithValidation } from './apiSchemas';

const result = await fetchWithValidation(
  () => fetch('https://api.coingecko.com/api/v3/coins/bitcoin').then(r => r.json()),
  CoinGeckoMarketDataSchema,
  'CoinGecko'
);

if (result.success) {
  console.log('Price:', result.data.current_price);
  console.log('Market Cap:', result.data.market_cap);
} else {
  console.error('Validation failed:', result.error);
}
```

### 2. CoinMarketCap Quote
```typescript
import { CoinMarketCapQuoteSchema, fetchWithValidation } from './apiSchemas';

const result = await fetchWithValidation(
  () => fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC')
    .then(r => r.json()),
  CoinMarketCapQuoteSchema,
  'CoinMarketCap'
);

if (result.success) {
  console.log('Price:', result.data.data.quote.USD.price);
}
```

### 3. Kraken Ticker
```typescript
import { KrakenTickerSchema, fetchWithValidation } from './apiSchemas';

const result = await fetchWithValidation(
  () => fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD')
    .then(r => r.json()),
  KrakenTickerSchema,
  'Kraken'
);

if (result.success) {
  const ticker = result.data.result.XXBTZUSD;
  console.log('Last Price:', ticker.c[0]);
  console.log('24h Volume:', ticker.v[1]);
}
```

### 4. LunarCrush Sentiment
```typescript
import { LunarCrushSentimentSchema, fetchWithValidation } from './apiSchemas';

const result = await fetchWithValidation(
  () => fetch('https://api.lunarcrush.com/v2?data=assets&symbol=BTC')
    .then(r => r.json()),
  LunarCrushSentimentSchema,
  'LunarCrush'
);

if (result.success) {
  console.log('Galaxy Score:', result.data.data.galaxy_score);
  console.log('Sentiment:', result.data.data.sentiment);
  console.log('Social Volume:', result.data.data.social_volume);
}
```

### 5. Blockchain.com Info
```typescript
import { BlockchainInfoSchema, fetchWithValidation } from './apiSchemas';

const result = await fetchWithValidation(
  () => fetch('https://api.blockchain.info/stats')
    .then(r => r.json()),
  BlockchainInfoSchema,
  'Blockchain.com'
);

if (result.success) {
  console.log('Hash Rate:', result.data.hash_rate);
  console.log('Difficulty:', result.data.difficulty);
  console.log('Mempool Size:', result.data.mempool_size);
}
```

## Helper Functions

### validateApiResponse()
Validates raw data against a Zod schema without fetching.

```typescript
import { validateApiResponse, CoinGeckoMarketDataSchema } from './apiSchemas';

const rawData = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  current_price: 95000,
  market_cap: 1800000000000,
  total_volume: 50000000000,
  price_change_percentage_24h: 2.5,
  last_updated: '2025-01-27T12:00:00Z'
};

const result = validateApiResponse(CoinGeckoMarketDataSchema, rawData, 'CoinGecko');

if (result.success) {
  // Data is valid and typed
  console.log(result.data.current_price);
} else {
  // Validation failed
  console.error(result.error);
}
```

### fetchWithValidation()
Fetches data from an API and validates it in one step.

```typescript
import { fetchWithValidation, CoinGeckoMarketDataSchema } from './apiSchemas';

const result = await fetchWithValidation(
  async () => {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin');
    return response.json();
  },
  CoinGeckoMarketDataSchema,
  'CoinGecko'
);

if (result.success) {
  // Data is fetched and validated
  console.log(result.data.current_price);
} else {
  // Either fetch or validation failed
  console.error(result.error);
}
```

## Error Handling

All validation functions return a consistent result object:

```typescript
type ValidationResult<T> = {
  success: boolean;
  data?: T;        // Present only if success is true
  error?: string;  // Present only if success is false
};
```

### Example Error Handling

```typescript
const result = await fetchWithValidation(
  () => fetchMarketData(),
  CoinGeckoMarketDataSchema,
  'CoinGecko'
);

if (!result.success) {
  // Log error for monitoring
  console.error('API validation failed:', result.error);
  
  // Send alert if critical
  if (result.error.includes('fetch failed')) {
    await sendAlert('CoinGecko API is down');
  }
  
  // Use fallback data
  return getFallbackMarketData();
}

// Proceed with validated data
return processMarketData(result.data);
```

## Type Safety

All schemas export TypeScript types for use throughout the application:

```typescript
import type {
  CoinGeckoMarketData,
  CoinMarketCapQuote,
  KrakenTicker,
  LunarCrushSentiment,
  BlockchainInfo
} from './apiSchemas';

function processMarketData(data: CoinGeckoMarketData) {
  // TypeScript knows the exact shape of data
  console.log(data.current_price); // ✓ Type-safe
  console.log(data.invalid_field);  // ✗ TypeScript error
}
```

## Best Practices

1. **Always validate external API responses** before processing
2. **Use fetchWithValidation()** for new API integrations
3. **Handle validation errors gracefully** with fallback strategies
4. **Log validation failures** for monitoring and debugging
5. **Update schemas** when API contracts change
6. **Write tests** for new schemas to ensure correctness

## Testing

Run the test suite to verify all schemas:

```bash
npm test -- __tests__/veritas-api-schemas.test.ts
```

All schemas have comprehensive test coverage including:
- Valid data validation
- Invalid data rejection
- Optional field handling
- Error message clarity
- Edge case handling

## Requirements Coverage

This implementation satisfies the following Veritas Protocol requirements:

- **Requirement 13.1**: Runtime validation of all external API responses
- **Requirement 13.2**: Type-safe data processing with Zod schemas

## Related Files

- `lib/ucie/veritas/validators/` - Validation logic using these schemas
- `lib/ucie/veritas/utils/` - Utility functions for validation
- `__tests__/veritas-api-schemas.test.ts` - Comprehensive test suite
