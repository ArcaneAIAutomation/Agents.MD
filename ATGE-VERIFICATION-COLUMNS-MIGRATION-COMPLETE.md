# ATGE Verification Columns Migration - Complete

**Date**: January 27, 2025  
**Status**: ✅ **COMPLETE**  
**Migration**: `006_add_verification_columns.sql`  
**Requirements**: 4.4

---

## Overview

Successfully added verification tracking columns to the ATGE (AI Trade Generation Engine) database schema. This migration enables real-time trade verification, profit/loss tracking, and Bitcoin on-chain metrics integration.

---

## Changes Made

### 1. Trade Results Verification Columns

Added to `trade_results` table:

| Column | Type | Purpose |
|--------|------|---------|
| `last_verified_at` | TIMESTAMPTZ | Timestamp of last verification check against live market data |
| `verification_data_source` | VARCHAR(100) | Data source used for verification (e.g., CoinMarketCap, CoinGecko) |

**Use Case**: Track when trades were last verified and which API was used, enabling:
- Identification of stale trades needing re-verification
- Data source reliability tracking
- Verification frequency monitoring

### 2. Bitcoin On-Chain Metrics

Added to `trade_market_snapshot` table:

| Column | Type | Purpose |
|--------|------|---------|
| `sopr_value` | DECIMAL(10,6) | Spent Output Profit Ratio (Bitcoin only) |
| `mvrv_z_score` | DECIMAL(10,6) | Market Value to Realized Value Z-Score (Bitcoin only) |

**Interpretation**:
- **SOPR > 1**: Profitable spending (bullish signal)
- **SOPR < 1**: Loss-taking (bearish signal)
- **MVRV > 7**: Overvalued (potential top)
- **MVRV < 0**: Undervalued (potential bottom)

### 3. Performance Indexes

Created indexes for efficient verification queries:

```sql
-- Find unverified or stale trades
CREATE INDEX idx_trade_results_last_verified_at 
ON trade_results(last_verified_at) 
WHERE last_verified_at IS NOT NULL;

-- Find trades by verification source
CREATE INDEX idx_trade_results_verification_source 
ON trade_results(verification_data_source) 
WHERE verification_data_source IS NOT NULL;
```

### 4. Verification Status View

Created `vw_trade_verification_status` view for easy querying:

```sql
SELECT 
  trade_signal_id,
  symbol,
  trade_status,
  generated_at,
  expires_at,
  last_verified_at,
  verification_data_source,
  verification_status,  -- 'never_verified', 'stale', 'current'
  hours_since_verification
FROM vw_trade_verification_status
WHERE trade_status = 'active';
```

**Verification Status Logic**:
- `never_verified`: No verification has occurred
- `stale`: Last verification > 1 hour ago
- `current`: Verified within last hour

### 5. Bitcoin Metrics View

Created `vw_bitcoin_onchain_metrics` view for Bitcoin analysis:

```sql
SELECT 
  trade_signal_id,
  symbol,
  generated_at,
  sopr_value,
  mvrv_z_score,
  sopr_signal,    -- 'bullish', 'bearish', 'neutral'
  mvrv_signal,    -- 'overvalued', 'undervalued', 'fair_value'
  snapshot_at
FROM vw_bitcoin_onchain_metrics
WHERE symbol = 'BTC';
```

---

## Verification Results

### ✅ All Columns Added Successfully

**trade_results**:
- ✅ `last_verified_at` (timestamp with time zone, nullable)
- ✅ `verification_data_source` (character varying, nullable)

**trade_market_snapshot**:
- ✅ `sopr_value` (numeric, nullable)
- ✅ `mvrv_z_score` (numeric, nullable)

### ✅ All Indexes Created

- ✅ `idx_trade_results_last_verified_at`
- ✅ `idx_trade_results_verification_source`

### ✅ All Views Created

- ✅ `vw_trade_verification_status`
- ✅ `vw_bitcoin_onchain_metrics`

---

## Database Schema Updates

### Before Migration

```sql
-- trade_results (missing verification columns)
CREATE TABLE trade_results (
  id UUID PRIMARY KEY,
  trade_signal_id UUID NOT NULL,
  actual_entry_price DECIMAL(20, 8),
  -- ... other columns
  data_source VARCHAR(50),
  data_quality_score INTEGER
);

-- trade_market_snapshot (missing Bitcoin metrics)
CREATE TABLE trade_market_snapshot (
  id UUID PRIMARY KEY,
  trade_signal_id UUID NOT NULL,
  current_price DECIMAL(20, 8),
  -- ... other columns
  fear_greed_index INTEGER
);
```

### After Migration

```sql
-- trade_results (with verification tracking)
CREATE TABLE trade_results (
  id UUID PRIMARY KEY,
  trade_signal_id UUID NOT NULL,
  actual_entry_price DECIMAL(20, 8),
  -- ... other columns
  data_source VARCHAR(50),
  data_quality_score INTEGER,
  last_verified_at TIMESTAMPTZ,           -- NEW
  verification_data_source VARCHAR(100)   -- NEW
);

-- trade_market_snapshot (with Bitcoin metrics)
CREATE TABLE trade_market_snapshot (
  id UUID PRIMARY KEY,
  trade_signal_id UUID NOT NULL,
  current_price DECIMAL(20, 8),
  -- ... other columns
  fear_greed_index INTEGER,
  sopr_value DECIMAL(10, 6),      -- NEW (Bitcoin only)
  mvrv_z_score DECIMAL(10, 6)     -- NEW (Bitcoin only)
);
```

---

## Usage Examples

### 1. Find Trades Needing Verification

```sql
-- Find all active trades that have never been verified
SELECT * FROM vw_trade_verification_status
WHERE verification_status = 'never_verified';

-- Find all active trades with stale verification (>1 hour)
SELECT * FROM vw_trade_verification_status
WHERE verification_status = 'stale';
```

### 2. Update Verification Data

```typescript
// After verifying a trade
await query(`
  UPDATE trade_results
  SET 
    last_verified_at = NOW(),
    verification_data_source = $1,
    tp1_hit = $2,
    tp1_hit_price = $3,
    profit_loss_usd = $4
  WHERE trade_signal_id = $5
`, [dataSource, tp1Hit, tp1Price, profitLoss, tradeSignalId]);
```

### 3. Store Bitcoin On-Chain Metrics

```typescript
// When generating a Bitcoin trade signal
await query(`
  INSERT INTO trade_market_snapshot (
    trade_signal_id,
    current_price,
    sopr_value,
    mvrv_z_score,
    snapshot_at
  ) VALUES ($1, $2, $3, $4, NOW())
`, [tradeSignalId, currentPrice, soprValue, mvrvZScore]);
```

### 4. Query Bitcoin Metrics

```sql
-- Get recent Bitcoin trades with on-chain signals
SELECT 
  trade_signal_id,
  sopr_value,
  sopr_signal,
  mvrv_z_score,
  mvrv_signal
FROM vw_bitcoin_onchain_metrics
WHERE generated_at > NOW() - INTERVAL '7 days'
ORDER BY generated_at DESC;
```

---

## Next Steps

### Phase 1: Trade Verification Endpoint (Task 6-9)

1. **Create `/api/atge/verify-trades` endpoint**
   - Fetch all active trades from database
   - Get current market price from CoinMarketCap/CoinGecko
   - Check if TP1/TP2/TP3 or stop loss hit
   - Calculate profit/loss
   - Update `last_verified_at` and `verification_data_source`

2. **Implement target hit detection**
   - Compare current price against TP levels
   - Update `tp1_hit`, `tp2_hit`, `tp3_hit` flags
   - Record hit timestamps and prices
   - Update trade status

3. **Implement P/L calculation**
   - Calculate profit/loss in USD
   - Calculate profit/loss percentage
   - Store in `net_profit_loss_usd`
   - Include data source and timestamp

### Phase 2: Glassnode Integration (Task 20-22)

1. **Integrate Glassnode API for SOPR**
   - Add `GLASSNODE_API_KEY` to environment
   - Create `lib/atge/glassnode.ts`
   - Implement SOPR fetching with 1-hour cache
   - Store in `trade_market_snapshot.sopr_value`

2. **Integrate Glassnode API for MVRV Z-Score**
   - Add MVRV Z-Score fetching function
   - Implement 1-hour cache
   - Store in `trade_market_snapshot.mvrv_z_score`

3. **Display in Trade Details modal**
   - Show SOPR with interpretation
   - Show MVRV Z-Score with interpretation
   - Handle missing data gracefully

### Phase 3: Dashboard Integration (Task 10-12)

1. **Create statistics endpoint**
   - Query verification data
   - Calculate win rate, profit factor
   - Return performance metrics

2. **Update dashboard component**
   - Display verification status
   - Show Bitcoin on-chain metrics
   - Add refresh button

---

## Migration Files

### Created Files

1. **`migrations/006_add_verification_columns.sql`**
   - Main migration script
   - Adds all columns, indexes, and views
   - Includes verification queries

2. **`scripts/run-verification-columns-migration.ts`**
   - Migration runner script
   - Verifies all changes
   - Provides detailed output

### Migration Execution

```bash
# Run the migration
npx tsx scripts/run-verification-columns-migration.ts

# Expected output:
# ✅ All columns added
# ✅ All indexes created
# ✅ All views created
# ✅ Migration completed successfully
```

---

## Technical Details

### Column Specifications

```sql
-- Verification tracking
last_verified_at TIMESTAMPTZ
  - Nullable: YES
  - Default: NULL
  - Purpose: Track last verification time

verification_data_source VARCHAR(100)
  - Nullable: YES
  - Default: NULL
  - Purpose: Track which API was used
  - Examples: 'CoinMarketCap', 'CoinGecko'

-- Bitcoin on-chain metrics
sopr_value DECIMAL(10, 6)
  - Nullable: YES
  - Default: NULL
  - Range: Typically 0.5 to 2.0
  - Purpose: Spent Output Profit Ratio

mvrv_z_score DECIMAL(10, 6)
  - Nullable: YES
  - Default: NULL
  - Range: Typically -2 to 10
  - Purpose: Market Value to Realized Value Z-Score
```

### Index Specifications

```sql
-- Partial index for verified trades only
CREATE INDEX idx_trade_results_last_verified_at 
ON trade_results(last_verified_at) 
WHERE last_verified_at IS NOT NULL;

-- Partial index for trades with verification source
CREATE INDEX idx_trade_results_verification_source 
ON trade_results(verification_data_source) 
WHERE verification_data_source IS NOT NULL;
```

**Benefits**:
- Smaller index size (only includes verified trades)
- Faster queries for verification status
- Efficient filtering of stale trades

---

## Performance Considerations

### Query Optimization

1. **Verification Status Queries**
   - Use `vw_trade_verification_status` view
   - Indexes ensure fast filtering
   - Partial indexes reduce storage

2. **Bitcoin Metrics Queries**
   - Use `vw_bitcoin_onchain_metrics` view
   - Filtered by symbol = 'BTC'
   - Efficient for dashboard display

3. **Bulk Verification**
   - Batch updates for multiple trades
   - Use prepared statements
   - Minimize database round-trips

### Caching Strategy

1. **Glassnode Data**
   - Cache SOPR and MVRV for 1 hour
   - Reduce API calls
   - Store in database for persistence

2. **Verification Results**
   - Cache verification status for 5 minutes
   - Refresh on user request
   - Use `last_verified_at` for staleness check

---

## Testing

### Verification Tests

```typescript
// Test 1: Verify columns exist
const columns = await query(`
  SELECT column_name 
  FROM information_schema.columns
  WHERE table_name = 'trade_results'
  AND column_name IN ('last_verified_at', 'verification_data_source')
`);
// Expected: 2 rows

// Test 2: Verify indexes exist
const indexes = await query(`
  SELECT indexname 
  FROM pg_indexes
  WHERE tablename = 'trade_results'
  AND indexname LIKE '%verification%'
`);
// Expected: 2 rows

// Test 3: Verify views exist
const views = await query(`
  SELECT table_name 
  FROM information_schema.views
  WHERE table_name IN ('vw_trade_verification_status', 'vw_bitcoin_onchain_metrics')
`);
// Expected: 2 rows
```

### Integration Tests

```typescript
// Test 4: Insert and verify trade
const tradeId = await createTestTrade();
await verifyTrade(tradeId, 'CoinMarketCap');

const result = await query(`
  SELECT last_verified_at, verification_data_source
  FROM trade_results
  WHERE trade_signal_id = $1
`, [tradeId]);

// Expected: last_verified_at is recent, source is 'CoinMarketCap'

// Test 5: Store Bitcoin metrics
await storeBitcoinMetrics(tradeId, 1.05, 3.2);

const metrics = await query(`
  SELECT sopr_value, mvrv_z_score
  FROM trade_market_snapshot
  WHERE trade_signal_id = $1
`, [tradeId]);

// Expected: sopr_value = 1.05, mvrv_z_score = 3.2
```

---

## Documentation

### API Documentation

Update API documentation to include:
- Verification endpoint specification
- Glassnode integration guide
- Dashboard statistics endpoint
- View usage examples

### User Documentation

Update user guide to include:
- Verification status explanation
- Bitcoin on-chain metrics interpretation
- Dashboard statistics meaning
- Refresh functionality

---

## Success Criteria

### ✅ All Criteria Met

- [x] `last_verified_at` column added to `trade_results`
- [x] `verification_data_source` column added to `trade_results`
- [x] `sopr_value` column added to `trade_market_snapshot`
- [x] `mvrv_z_score` column added to `trade_market_snapshot`
- [x] Migration script created (`006_add_verification_columns.sql`)
- [x] Migration executed on Supabase database
- [x] All columns verified in database
- [x] All indexes created and verified
- [x] All views created and verified
- [x] Migration runner script created
- [x] Documentation complete

---

## Conclusion

The ATGE verification columns migration has been successfully completed. The database schema now supports:

1. **Real-time trade verification** with timestamp and source tracking
2. **Bitcoin on-chain metrics** (SOPR and MVRV Z-Score)
3. **Efficient verification queries** with optimized indexes
4. **Easy data access** through dedicated views

The system is now ready for Phase 1 implementation (trade verification endpoint) and Phase 2 (Glassnode integration).

---

**Status**: ✅ **MIGRATION COMPLETE**  
**Next Task**: Task 6 - Create `/api/atge/verify-trades` endpoint  
**Requirements Satisfied**: 4.4

