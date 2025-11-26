# Quantum BTC Super Spec - Database Migrations

This directory contains all database migrations for the Quantum Bitcoin Intelligence Engine.

## Overview

The Quantum BTC system requires 5 database tables:

1. **btc_trades** - Stores all generated Bitcoin trade signals with complete quantum reasoning
2. **btc_hourly_snapshots** - Stores hourly market state for trade validation and deviation tracking
3. **quantum_anomaly_logs** - Tracks all detected anomalies and system suspensions
4. **prediction_accuracy_database** - Tracks overall system performance and accuracy metrics
5. **api_latency_reliability_logs** - Tracks API performance, latency, and reliability metrics

## Migration Files

### Individual Migrations
- `001_create_btc_trades.sql` - Creates btc_trades table
- `002_create_btc_hourly_snapshots.sql` - Creates btc_hourly_snapshots table
- `003_create_quantum_anomaly_logs.sql` - Creates quantum_anomaly_logs table
- `004_create_prediction_accuracy_database.sql` - Creates prediction_accuracy_database table
- `005_create_api_latency_reliability_logs.sql` - Creates api_latency_reliability_logs table

### Complete Migration
- `000_quantum_btc_complete_migration.sql` - **Recommended** - Creates all tables in one transaction

### Rollback
- `999_quantum_btc_rollback.sql` - Drops all Quantum BTC tables (use with caution!)

## Running Migrations

### Option 1: Using TypeScript Script (Recommended)

```bash
# Run complete migration
npx tsx scripts/run-quantum-btc-migration.ts

# Verify migration
npx tsx scripts/run-quantum-btc-migration.ts --verify

# Rollback (WARNING: Drops all tables!)
npx tsx scripts/run-quantum-btc-migration.ts --rollback
```

### Option 2: Using psql

```bash
# Run complete migration
psql $DATABASE_URL -f migrations/quantum-btc/000_quantum_btc_complete_migration.sql

# Run individual migrations
psql $DATABASE_URL -f migrations/quantum-btc/001_create_btc_trades.sql
psql $DATABASE_URL -f migrations/quantum-btc/002_create_btc_hourly_snapshots.sql
# ... etc

# Rollback
psql $DATABASE_URL -f migrations/quantum-btc/999_quantum_btc_rollback.sql
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `000_quantum_btc_complete_migration.sql`
4. Click "Run" to execute

## Verification

After running the migration, verify it was successful:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE 'btc_%' 
  OR table_name LIKE 'quantum_%' 
  OR table_name LIKE 'prediction_%' 
  OR table_name LIKE 'api_%'
)
ORDER BY table_name;

-- Expected result: 5 tables
-- - api_latency_reliability_logs
-- - btc_hourly_snapshots
-- - btc_trades
-- - prediction_accuracy_database
-- - quantum_anomaly_logs

-- Check indexes
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (
  tablename LIKE 'btc_%' 
  OR tablename LIKE 'quantum_%' 
  OR tablename LIKE 'prediction_%' 
  OR tablename LIKE 'api_%'
);

-- Expected result: 15+ indexes
```

## Database Schema

### btc_trades

Stores all generated Bitcoin trade signals with complete quantum reasoning.

**Key Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `entry_min`, `entry_max`, `entry_optimal` - Entry zone prices
- `tp1_price`, `tp2_price`, `tp3_price` - Take profit targets
- `stop_loss_price` - Stop loss price
- `confidence_score` - AI confidence (0-100)
- `quantum_reasoning` - AI reasoning text
- `data_quality_score` - Data quality (0-100)
- `status` - Trade status (ACTIVE, HIT, NOT_HIT, INVALIDATED, EXPIRED)

**Indexes:**
- `idx_btc_trades_user_id` - User lookup
- `idx_btc_trades_status` - Status filtering
- `idx_btc_trades_generated_at` - Time-based queries
- `idx_btc_trades_expires_at` - Expiration checks

### btc_hourly_snapshots

Stores hourly market state for trade validation.

**Key Columns:**
- `id` - UUID primary key
- `trade_id` - Foreign key to btc_trades
- `price`, `volume_24h`, `market_cap` - Market data
- `mempool_size`, `whale_transactions` - On-chain data
- `sentiment_score`, `social_dominance` - Sentiment data
- `deviation_from_prediction` - Accuracy metric
- `phase_shift_detected` - Market structure change flag

**Indexes:**
- `idx_btc_hourly_snapshots_trade_id` - Trade lookup
- `idx_btc_hourly_snapshots_snapshot_at` - Time-based queries

### quantum_anomaly_logs

Tracks all detected anomalies and system suspensions.

**Key Columns:**
- `id` - UUID primary key
- `anomaly_type` - Type of anomaly
- `severity` - INFO, WARNING, ERROR, FATAL
- `description` - Anomaly description
- `affected_sources` - JSONB of affected APIs
- `system_suspended` - Whether system was suspended
- `trade_id` - Optional reference to trade

**Indexes:**
- `idx_quantum_anomaly_logs_severity` - Severity filtering
- `idx_quantum_anomaly_logs_detected_at` - Time-based queries
- `idx_quantum_anomaly_logs_trade_id` - Trade lookup
- `idx_quantum_anomaly_logs_anomaly_type` - Type filtering

### prediction_accuracy_database

Tracks overall system performance and accuracy metrics.

**Key Columns:**
- `id` - UUID primary key
- `total_trades`, `trades_hit`, `trades_not_hit` - Trade counts
- `overall_accuracy_rate` - Overall accuracy percentage
- `accuracy_1h`, `accuracy_4h`, `accuracy_1d`, `accuracy_1w` - Timeframe accuracy
- `api_reliability_cmc`, `api_reliability_coingecko`, etc. - API reliability scores
- `total_anomalies`, `fatal_anomalies` - Anomaly counts
- `period_start`, `period_end` - Time period for metrics

**Indexes:**
- `idx_prediction_accuracy_period` - Period lookup
- `idx_prediction_accuracy_created_at` - Time-based queries

### api_latency_reliability_logs

Tracks API performance, latency, and reliability metrics.

**Key Columns:**
- `id` - UUID primary key
- `api_name` - API name (CMC, CoinGecko, Kraken, etc.)
- `endpoint` - API endpoint called
- `response_time_ms` - Response time in milliseconds
- `status_code` - HTTP status code
- `success` - Whether request succeeded
- `error_message` - Error details if failed
- `trade_id` - Optional reference to trade

**Indexes:**
- `idx_api_latency_logs_api_name` - API filtering
- `idx_api_latency_logs_requested_at` - Time-based queries
- `idx_api_latency_logs_success` - Success/failure filtering
- `idx_api_latency_logs_status_code` - Status code filtering
- `idx_api_latency_logs_trade_id` - Trade lookup

## Foreign Key Relationships

```
users (existing table)
  ↓
btc_trades
  ↓
  ├─→ btc_hourly_snapshots (CASCADE DELETE)
  ├─→ quantum_anomaly_logs (SET NULL)
  └─→ api_latency_reliability_logs (SET NULL)
```

## Triggers

### btc_trades
- `trigger_btc_trades_updated_at` - Automatically updates `updated_at` on row update

### prediction_accuracy_database
- `trigger_prediction_accuracy_updated_at` - Automatically updates `updated_at` on row update

## Requirements Mapping

- **Requirement 6.1, 6.2** - btc_trades table
- **Requirement 4.7, 4.8** - btc_hourly_snapshots table
- **Requirement 4.14** - quantum_anomaly_logs table
- **Requirement 12.1-12.10** - prediction_accuracy_database table
- **Requirement 8.10** - api_latency_reliability_logs table

## Rollback Procedure

If you need to rollback the migration:

1. **Backup your data first!**
   ```sql
   -- Export data if needed
   COPY btc_trades TO '/tmp/btc_trades_backup.csv' CSV HEADER;
   -- ... repeat for other tables
   ```

2. **Run rollback**
   ```bash
   npx tsx scripts/run-quantum-btc-migration.ts --rollback
   ```

3. **Verify rollback**
   ```bash
   npx tsx scripts/run-quantum-btc-migration.ts --verify
   ```

## Troubleshooting

### Error: relation "users" does not exist

The `btc_trades` table has a foreign key to the `users` table. Ensure the authentication system is set up first.

**Solution**: Run the authentication migrations before Quantum BTC migrations.

### Error: permission denied

Ensure your database user has CREATE TABLE permissions.

**Solution**: 
```sql
GRANT CREATE ON SCHEMA public TO your_user;
```

### Error: table already exists

The migration uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen. If it does, you may need to drop the existing table first.

**Solution**: Run the rollback migration first, then re-run the migration.

## Next Steps

After running the migration:

1. ✅ Verify all tables exist
2. ✅ Verify all indexes exist
3. ✅ Test inserting sample data
4. ✅ Proceed to Task 2: API Integration Layer

## Support

For issues or questions:
- Check the main spec: `.kiro/specs/quantum-btc-super-spec/`
- Review requirements: `.kiro/specs/quantum-btc-super-spec/requirements.md`
- Review design: `.kiro/specs/quantum-btc-super-spec/design.md`

---

**Status**: ✅ Migration Ready  
**Version**: 1.0.0  
**Last Updated**: November 25, 2025
