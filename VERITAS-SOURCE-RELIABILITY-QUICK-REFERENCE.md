# Veritas Source Reliability Tracker - Quick Reference

## Quick Start

```typescript
import { getSourceReliabilityTracker } from './lib/ucie/veritas/utils/sourceReliabilityTracker';

// Get the global tracker instance
const tracker = await getSourceReliabilityTracker();

// Get trust weight for a source (0-1)
const weight = tracker.getTrustWeight('CoinGecko');

// Update reliability after validation
await tracker.updateReliability('CoinGecko', 'pass');
await tracker.updateReliability('CoinMarketCap', 'fail');
await tracker.updateReliability('Kraken', 'deviation', 2.5);
```

---

## Common Operations

### Get Trust Weight

```typescript
// Returns 0.5-1.0 based on historical reliability
// New sources default to 1.0
const weight = tracker.getTrustWeight('CoinGecko');
```

### Update After Validation

```typescript
// Pass: Validation succeeded
await tracker.updateReliability('CoinGecko', 'pass');

// Fail: Validation failed
await tracker.updateReliability('CoinMarketCap', 'fail');

// Deviation: Source deviated from consensus
await tracker.updateReliability('Kraken', 'deviation', 2.5);
```

### Get Reliability Score

```typescript
const score = tracker.getReliabilityScore('CoinGecko');
// Returns: {
//   sourceName: 'CoinGecko',
//   reliabilityScore: 85.5,
//   totalValidations: 100,
//   successfulValidations: 85,
//   deviationCount: 5,
//   lastUpdated: '2025-01-27T...',
//   trustWeight: 0.9
// }
```

### Identify Problem Sources

```typescript
// Get sources below 70% reliability
const unreliable = tracker.getUnreliableSources(70);
// Returns: ['CoinGecko', 'CoinMarketCap']

// Get sources above 90% reliability
const reliable = tracker.getReliableSources(90);
// Returns: ['Kraken', 'Reddit']
```

### Get Statistics

```typescript
const summary = tracker.getSummary();
// Returns: {
//   totalSources: 10,
//   averageReliability: 75.5,
//   reliableSources: 5,
//   unreliableSources: 2,
//   totalValidations: 500
// }
```

---

## Trust Weight Tiers

| Reliability | Weight | Description |
|------------|--------|-------------|
| ≥ 90% | 1.0 | Full trust |
| 80-89% | 0.9 | High trust |
| 70-79% | 0.8 | Good trust |
| 60-69% | 0.7 | Moderate trust |
| 50-59% | 0.6 | Low trust |
| < 50% | 0.5 | Minimum trust |

---

## Integration Example

### Market Data Validator

```typescript
async function validateMarketData(symbol: string) {
  const tracker = await getSourceReliabilityTracker();
  
  // Fetch prices from multiple sources
  const prices = await Promise.all([
    fetchCoinGeckoPrice(symbol),
    fetchCoinMarketCapPrice(symbol),
    fetchKrakenPrice(symbol)
  ]);
  
  // Get trust weights
  const weights = {
    coinGecko: tracker.getTrustWeight('CoinGecko'),
    coinMarketCap: tracker.getTrustWeight('CoinMarketCap'),
    kraken: tracker.getTrustWeight('Kraken')
  };
  
  // Calculate weighted average
  const totalWeight = weights.coinGecko + weights.coinMarketCap + weights.kraken;
  const weightedPrice = (
    prices[0] * weights.coinGecko +
    prices[1] * weights.coinMarketCap +
    prices[2] * weights.kraken
  ) / totalWeight;
  
  // Check for discrepancies
  const variance = calculateVariance(prices);
  
  if (variance < 0.015) {
    // All sources agree - update as pass
    await tracker.updateReliability('CoinGecko', 'pass');
    await tracker.updateReliability('CoinMarketCap', 'pass');
    await tracker.updateReliability('Kraken', 'pass');
  } else {
    // Identify which source(s) deviated
    for (const [source, price] of Object.entries({
      CoinGecko: prices[0],
      CoinMarketCap: prices[1],
      Kraken: prices[2]
    })) {
      const deviation = Math.abs(price - weightedPrice) / weightedPrice;
      
      if (deviation > 0.015) {
        await tracker.updateReliability(source, 'deviation', deviation * 100);
      } else {
        await tracker.updateReliability(source, 'pass');
      }
    }
  }
  
  return {
    price: weightedPrice,
    variance,
    weights,
    sources: prices
  };
}
```

---

## Database Schema

```sql
CREATE TABLE veritas_source_reliability (
  id UUID PRIMARY KEY,
  source_name VARCHAR(100) UNIQUE NOT NULL,
  reliability_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  total_validations INTEGER NOT NULL DEFAULT 0,
  successful_validations INTEGER NOT NULL DEFAULT 0,
  deviation_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  trust_weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

---

## Testing

```bash
# Run comprehensive test suite
npx tsx scripts/test-source-reliability-tracker.ts

# Run database migration
npx tsx scripts/run-veritas-migration.ts
```

---

## API Reference

### Class: SourceReliabilityTracker

#### Methods

**`async initialize(): Promise<void>`**
- Loads existing scores from database
- Called automatically by `getSourceReliabilityTracker()`

**`async updateReliability(sourceName: string, result: 'pass' | 'fail' | 'deviation', deviationAmount?: number): Promise<void>`**
- Updates reliability score for a source
- Automatically adjusts trust weight
- Persists to database

**`getTrustWeight(sourceName: string): number`**
- Returns trust weight (0.5-1.0)
- Defaults to 1.0 for new sources
- Fast in-memory lookup

**`getReliabilityScore(sourceName: string): SourceReliabilityScore | null`**
- Returns complete reliability information
- Null if source not found

**`getAllScores(): SourceReliabilityScore[]`**
- Returns array of all tracked sources
- Useful for dashboards and reports

**`getUnreliableSources(threshold: number = 70): string[]`**
- Returns sources below threshold
- Default threshold: 70%

**`getReliableSources(threshold: number = 90): string[]`**
- Returns sources above threshold
- Default threshold: 90%

**`getSummary(): { totalSources, averageReliability, reliableSources, unreliableSources, totalValidations }`**
- Returns comprehensive statistics
- Useful for monitoring and reporting

**`async resetSource(sourceName: string): Promise<void>`**
- Resets reliability for a single source
- Removes from database

**`async resetAll(): Promise<void>`**
- Resets all reliability scores
- Clears database table

---

## Best Practices

### 1. Always Update After Validation

```typescript
// ✅ GOOD
const result = await validateData(source);
await tracker.updateReliability(source, result.passed ? 'pass' : 'fail');

// ❌ BAD
const result = await validateData(source);
// Forgot to update tracker
```

### 2. Use Trust Weights in Calculations

```typescript
// ✅ GOOD
const weight = tracker.getTrustWeight(source);
const weightedValue = value * weight;

// ❌ BAD
const weightedValue = value; // Ignoring reliability
```

### 3. Monitor Unreliable Sources

```typescript
// ✅ GOOD
const unreliable = tracker.getUnreliableSources(70);
if (unreliable.length > 0) {
  console.warn('Unreliable sources detected:', unreliable);
  // Send alert, log, or take action
}

// ❌ BAD
// Never checking for unreliable sources
```

### 4. Handle New Sources Gracefully

```typescript
// ✅ GOOD
const weight = tracker.getTrustWeight('NewSource');
// Returns 1.0 (default trust) for new sources

// ❌ BAD
const score = tracker.getReliabilityScore('NewSource');
if (!score) {
  throw new Error('Source not found'); // Unnecessary error
}
```

---

## Troubleshooting

### Issue: Trust weight not updating

**Cause**: Not calling `updateReliability()` after validation

**Solution**: Always update reliability after each validation:
```typescript
await tracker.updateReliability(source, result);
```

### Issue: Database connection errors

**Cause**: DATABASE_URL not set or incorrect

**Solution**: Check environment variables:
```bash
echo $DATABASE_URL
```

### Issue: Scores not persisting

**Cause**: Database table not created

**Solution**: Run migration:
```bash
npx tsx scripts/run-veritas-migration.ts
```

---

## Performance Tips

1. **Cache tracker instance**: Use `getSourceReliabilityTracker()` once per request
2. **Batch updates**: Update multiple sources in parallel with `Promise.all()`
3. **Use in-memory lookups**: `getTrustWeight()` is fast (<1ms)
4. **Limit history size**: Default 100 entries per source is sufficient

---

## Support

- **Documentation**: `VERITAS-SOURCE-RELIABILITY-COMPLETE.md`
- **Tests**: `scripts/test-source-reliability-tracker.ts`
- **Migration**: `migrations/005_veritas_source_reliability.sql`
- **Source Code**: `lib/ucie/veritas/utils/sourceReliabilityTracker.ts`
