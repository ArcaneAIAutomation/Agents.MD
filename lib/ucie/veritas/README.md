# Veritas Protocol - Data Validation System

## Overview

The **Veritas Protocol** is an institutional-grade data validation system for the Universal Crypto Intelligence Engine (UCIE). It adds sophisticated cross-validation, logical consistency checks, and transparent discrepancy reporting without breaking any existing functionality.

## Core Principles

1. **Truth Before Analysis**: Never analyze data you have not first validated
2. **Backward Compatibility**: All existing UCIE components work unchanged
3. **Graceful Degradation**: Validation failures don't break analysis
4. **Feature Flag Control**: Easy enable/disable without code changes
5. **Transparency**: Clear reporting of data quality issues

## Quick Start

### 1. Enable Veritas Protocol

Add to your `.env.local` file:

```env
ENABLE_VERITAS_PROTOCOL=true
```

### 2. Use in API Endpoints

```typescript
import { validateWithVeritas } from '@/lib/ucie/veritas';

export default async function handler(req, res) {
  const { symbol } = req.query;
  
  // Wrap existing data fetching with validation
  const result = await validateWithVeritas(
    () => fetchMarketData(symbol),
    (data) => validateMarketData(symbol, data)
  );
  
  // Return data with optional validation
  return res.json({
    ...result.data,
    veritasValidation: result.validation
  });
}
```

### 3. Check Validation Results

```typescript
const response = await fetch('/api/ucie/market-data/BTC');
const data = await response.json();

if (data.veritasValidation) {
  console.log('Confidence Score:', data.veritasValidation.confidence);
  console.log('Alerts:', data.veritasValidation.alerts);
  console.log('Data Quality:', data.veritasValidation.dataQualitySummary);
}
```

## Features

### Cross-Source Validation

Verify data across multiple independent sources:

- **Market Data**: CoinGecko, CoinMarketCap, Kraken
- **Social Sentiment**: LunarCrush, Twitter/X, Reddit
- **On-Chain Data**: Etherscan, Blockchain.com
- **News**: NewsAPI, CryptoCompare

### Logical Consistency Checks

Detect impossible data states:

- Volume exists but no transactions recorded
- Social mentions are zero but sentiment distribution is non-zero
- Market cap calculated but circulating supply is zero
- Exchange flows are zero but trading volume is massive

### Discrepancy Alerts

Transparent reporting of data quality issues:

- **Info**: Minor discrepancies within acceptable range
- **Warning**: Discrepancies exceeding thresholds
- **Error**: Significant data quality issues
- **Fatal**: Logical impossibilities detected

### Confidence Scoring

0-100 score indicating analysis reliability:

- **Data Source Agreement** (40% weight): How well sources agree
- **Logical Consistency** (30% weight): No impossible data states
- **Cross-Validation Success** (20% weight): Percentage of checks passed
- **Completeness** (10% weight): How much data is available

## Configuration

### Environment Variables

```env
# Enable/disable Veritas Protocol
ENABLE_VERITAS_PROTOCOL=false

# Validation timeout (milliseconds)
VERITAS_TIMEOUT_MS=5000

# Cache validation results (milliseconds)
VERITAS_CACHE_TTL_MS=300000

# Feature-specific flags (optional)
ENABLE_VERITAS_MARKET=true
ENABLE_VERITAS_SOCIAL=true
ENABLE_VERITAS_ONCHAIN=true
ENABLE_VERITAS_NEWS=true
```

### Feature Flags

```typescript
import { isVeritasEnabled, isValidationFeatureEnabled } from '@/lib/ucie/veritas';

// Check if Veritas is enabled globally
if (isVeritasEnabled()) {
  console.log('Veritas Protocol is enabled');
}

// Check specific features
if (isValidationFeatureEnabled('market')) {
  console.log('Market validation is enabled');
}
```

## API Reference

### Core Functions

#### `validateWithVeritas<T>`

Main validation middleware function.

```typescript
async function validateWithVeritas<T>(
  dataFetcher: () => Promise<T>,
  validator: (data: T) => Promise<VeritasValidationResult>,
  options?: ValidationOptions
): Promise<{ data: T; validation?: VeritasValidationResult }>
```

**Parameters:**
- `dataFetcher`: Function that fetches the data
- `validator`: Function that validates the data
- `options`: Optional validation options

**Returns:**
- Object with `data` and optional `validation` fields

**Example:**
```typescript
const result = await validateWithVeritas(
  () => fetchMarketData('BTC'),
  (data) => validateMarketData('BTC', data),
  {
    timeout: 5000,
    fallbackOnError: true
  }
);
```

#### `isVeritasEnabled()`

Check if Veritas Protocol is enabled.

```typescript
function isVeritasEnabled(): boolean
```

**Returns:**
- `true` if `ENABLE_VERITAS_PROTOCOL=true`, otherwise `false`

#### `getVeritasConfig()`

Get Veritas Protocol configuration.

```typescript
function getVeritasConfig(): VeritasConfig
```

**Returns:**
- Configuration object with all settings

#### `createValidatedResponse<T>`

Create API response with optional validation.

```typescript
function createValidatedResponse<T extends object>(
  data: T,
  validation?: VeritasValidationResult
): T & { veritasValidation?: VeritasValidationResult }
```

**Parameters:**
- `data`: Original data object
- `validation`: Optional validation results

**Returns:**
- Data object with optional `veritasValidation` field

### Validation Cache

#### `getCachedValidation()`

Get cached validation result.

```typescript
function getCachedValidation(
  key: string,
  ttl?: number
): VeritasValidationResult | null
```

#### `setCachedValidation()`

Set cached validation result.

```typescript
function setCachedValidation(
  key: string,
  result: VeritasValidationResult
): void
```

#### `clearValidationCache()`

Clear validation cache.

```typescript
function clearValidationCache(key?: string): void
```

## Type Definitions

### `VeritasValidationResult`

```typescript
interface VeritasValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  alerts: ValidationAlert[];
  discrepancies: Discrepancy[];
  dataQualitySummary: DataQualitySummary;
}
```

### `ValidationAlert`

```typescript
interface ValidationAlert {
  severity: 'info' | 'warning' | 'error' | 'fatal';
  type: 'market' | 'social' | 'onchain' | 'news';
  message: string;
  affectedSources: string[];
  recommendation: string;
}
```

### `DataQualitySummary`

```typescript
interface DataQualitySummary {
  overallScore: number; // 0-100
  marketDataQuality: number;
  socialDataQuality: number;
  onChainDataQuality: number;
  newsDataQuality: number;
  passedChecks: string[];
  failedChecks: string[];
}
```

## Examples

See `examples/basicUsage.ts` for comprehensive examples including:

1. Basic API endpoint with validation
2. Conditional validation
3. Error handling with graceful degradation
4. Using validation cache
5. Feature-specific validation

## Testing

### Unit Tests

```bash
npm test lib/ucie/veritas
```

### Integration Tests

```bash
npm test -- --testPathPattern=veritas
```

## Backward Compatibility

The Veritas Protocol is designed to be 100% backward compatible:

- ✅ All existing API endpoints work unchanged
- ✅ Validation is completely optional
- ✅ Can be enabled/disabled without code changes
- ✅ No impact on performance when disabled
- ✅ Existing UI components work without modification

## Performance

- **Validation Timeout**: 5 seconds (configurable)
- **Cache TTL**: 5 minutes (configurable)
- **Parallel Validation**: Validators run in parallel for speed
- **Graceful Degradation**: Validation failures don't block analysis

## Security

- All validation uses existing API clients (no new keys required)
- Validation logic runs server-side only
- No sensitive validation data exposed to client
- Validation respects existing API rate limits

## Monitoring

Track validation metrics:

- Validation attempts, successes, failures
- Average validation time
- Alert counts by type
- Discrepancy counts by metric
- Average confidence score
- Fatal error rate

## Troubleshooting

### Validation Not Running

1. Check `ENABLE_VERITAS_PROTOCOL=true` in `.env.local`
2. Verify environment variable is loaded
3. Check console for feature flag status

### Validation Timing Out

1. Increase `VERITAS_TIMEOUT_MS` in `.env.local`
2. Check API response times
3. Verify network connectivity

### Validation Errors

1. Check console for error messages
2. Verify API keys are valid
3. Check API rate limits
4. Review validation logic

## Documentation

- **Complete Specification**: `.kiro/specs/ucie-veritas-protocol/`
- **Requirements**: `.kiro/specs/ucie-veritas-protocol/requirements.md`
- **Design**: `.kiro/specs/ucie-veritas-protocol/design.md`
- **Tasks**: `.kiro/specs/ucie-veritas-protocol/tasks.md`

## Support

For issues or questions:

1. Check this README
2. Review examples in `examples/`
3. Check specification documents
4. Review implementation in `lib/ucie/veritas/`

---

**Status**: ✅ Feature Flag System Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
