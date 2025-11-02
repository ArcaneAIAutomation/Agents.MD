# UCIE Database Migration Guide

**Status**: ✅ Automated  
**Time Required**: 2-5 minutes  
**Difficulty**: Easy (fully automated)

---

## Overview

This guide walks you through setting up the UCIE database tables in Supabase PostgreSQL. The migration is fully automated and creates 5 tables needed for UCIE functionality.

### Tables Created

1. **`ucie_analysis_cache`** - Caches complete analysis results (24h TTL)
2. **`ucie_watchlist`** - User watchlists for tracking tokens
3. **`ucie_alerts`** - Custom price/sentiment/whale alerts
4. **`ucie_api_costs`** - API cost tracking and monitoring
5. **`ucie_analysis_history`** - Analysis history for analytics

---

## Prerequisites

✅ **Already configured** (you have these):
- Supabase PostgreSQL database
- `DATABASE_URL` in `.env.local`
- `users` table exists (from authentication system)
- Node.js and npm installed

---

## Quick Start (Automated)

### Option 1: NPM Script (Recommended)

```bash
npm run migrate:ucie
```

That's it! The script will:
- ✅ Connect to your database
- ✅ Check for existing tables
- ✅ Create all 5 UCIE tables
- ✅ Create indexes for performance
- ✅ Verify everything worked
- ✅ Show table statistics

### Option 2: PowerShell Script (Windows)

```powershell
npm run migrate:ucie:ps1
```

### Option 3: Direct Execution

```bash
npx tsx scripts/run-ucie-migration.ts
```

---

## What the Script Does

### 1. Pre-Flight Checks
- ✅ Verifies `DATABASE_URL` is set
- ✅ Tests database connection
- ✅ Checks for existing UCIE tables

### 2. Migration Execution
- ✅ Reads `migrations/ucie_tables.sql`
- ✅ Executes CREATE TABLE statements
- ✅ Creates indexes for performance
- ✅ Adds table comments and documentation

### 3. Verification
- ✅ Confirms all 5 tables exist
- ✅ Verifies indexes were created
- ✅ Shows row counts for each table
- ✅ Displays success summary

---

## Expected Output

```
==================================================================
  UCIE Database Migration
==================================================================

ℹ️  Connecting to database...
ℹ️  Host: aws-1-eu-west-2.pooler.supabase.com:6543
ℹ️  Testing database connection...
✅ Connected successfully at 2025-01-27T...
ℹ️  Reading migration file: migrations/ucie_tables.sql
✅ Migration file loaded successfully
ℹ️  Checking for existing UCIE tables...
ℹ️  No existing UCIE tables found. Creating new tables...
ℹ️  Executing migration...
✅ Migration executed successfully!
ℹ️  Verifying table creation...

==================================================================
  Migration Results
==================================================================

✅ All 5 UCIE tables created successfully:
  ✓ ucie_alerts
  ✓ ucie_analysis_cache
  ✓ ucie_analysis_history
  ✓ ucie_api_costs
  ✓ ucie_watchlist

ℹ️  
Table statistics:
  ucie_alerts: 0 rows
  ucie_analysis_cache: 0 rows
  ucie_analysis_history: 0 rows
  ucie_api_costs: 0 rows
  ucie_watchlist: 0 rows

ℹ️  
Verifying indexes...
✅ Found 15 indexes:

  ucie_alerts:
    - idx_ucie_alerts_enabled
    - idx_ucie_alerts_symbol
    - idx_ucie_alerts_user
    - ucie_alerts_pkey

  ucie_analysis_cache:
    - idx_ucie_cache_expires
    - idx_ucie_cache_symbol
    - ucie_analysis_cache_pkey
    - ucie_analysis_cache_symbol_key

  ucie_analysis_history:
    - idx_ucie_history_created
    - idx_ucie_history_symbol
    - idx_ucie_history_user
    - ucie_analysis_history_pkey

  ucie_api_costs:
    - idx_ucie_costs_api
    - idx_ucie_costs_timestamp
    - idx_ucie_costs_user
    - ucie_api_costs_pkey

  ucie_watchlist:
    - idx_ucie_watchlist_symbol
    - idx_ucie_watchlist_user
    - ucie_watchlist_pkey
    - ucie_watchlist_user_symbol_key

==================================================================
  Migration Complete! 🎉
==================================================================

✅ UCIE database tables are ready to use

Next steps:
  1. Test UCIE API endpoints
  2. Run integration tests
  3. Deploy to production

ℹ️  Database connection closed
```

---

## Troubleshooting

### Error: DATABASE_URL not set

**Problem:**
```
❌ DATABASE_URL environment variable is not set
```

**Solution:**
1. Check `.env.local` exists
2. Verify `DATABASE_URL` is set:
   ```bash
   DATABASE_URL=postgres://postgres.xxx:password@host:6543/postgres
   ```
3. Restart your terminal/IDE

### Error: Connection timeout

**Problem:**
```
❌ Connection timeout detected
```

**Solution:**
1. Check your internet connection
2. Verify Supabase database is running
3. Check firewall settings
4. Try again in a few minutes

### Error: Permission denied

**Problem:**
```
❌ Database permission issue detected
```

**Solution:**
1. Verify your database user has CREATE TABLE permissions
2. Check Supabase dashboard → Database → Roles
3. Ensure your user has sufficient privileges

### Error: Relation "users" does not exist

**Problem:**
```
❌ This might be a foreign key constraint issue
```

**Solution:**
1. The UCIE tables reference the `users` table
2. Make sure authentication system is set up first
3. Run authentication migration before UCIE migration:
   ```bash
   npx tsx scripts/simple-migrate.ts
   ```

### Tables already exist

**Not an error!** The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

```
⚠️  Found 5 existing UCIE table(s):
  - ucie_alerts
  - ucie_analysis_cache
  - ucie_analysis_history
  - ucie_api_costs
  - ucie_watchlist
ℹ️  Migration will use CREATE TABLE IF NOT EXISTS (safe to run)
```

---

## Manual Verification

If you want to verify the tables manually:

### 1. Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ucie_%'
ORDER BY table_name;
```

**Expected result:** 5 tables

### 2. Check Table Structure

```sql
-- View ucie_analysis_cache structure
\d ucie_analysis_cache

-- View all UCIE tables
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name LIKE 'ucie_%'
ORDER BY table_name, ordinal_position;
```

### 3. Check Indexes

```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'ucie_%'
ORDER BY tablename, indexname;
```

**Expected result:** 15+ indexes

---

## Table Details

### ucie_analysis_cache

**Purpose:** Cache complete UCIE analysis results to reduce API calls

**Columns:**
- `id` - UUID primary key
- `symbol` - Token symbol (e.g., 'BTC', 'ETH')
- `data` - JSONB containing full analysis
- `data_quality_score` - Score 0-100 indicating data completeness
- `created_at` - When cached
- `expires_at` - When cache expires (24h default)

**Indexes:**
- `idx_ucie_cache_symbol` - Fast symbol lookup
- `idx_ucie_cache_expires` - Efficient cache cleanup

### ucie_watchlist

**Purpose:** Store user watchlists for tracking specific tokens

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `symbol` - Token symbol
- `added_at` - When added to watchlist

**Indexes:**
- `idx_ucie_watchlist_user` - Fast user lookup
- `idx_ucie_watchlist_symbol` - Fast symbol lookup

**Constraints:**
- Unique (user_id, symbol) - Prevent duplicates

### ucie_alerts

**Purpose:** User-configured alerts for price, sentiment, and on-chain events

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `symbol` - Token symbol
- `alert_type` - Type: 'price_above', 'price_below', 'sentiment_change', 'whale_tx'
- `threshold` - Numeric threshold for alert
- `enabled` - Whether alert is active
- `last_triggered` - Last time alert fired
- `created_at` - When created
- `updated_at` - Last modified

**Indexes:**
- `idx_ucie_alerts_user` - Fast user lookup
- `idx_ucie_alerts_symbol` - Fast symbol lookup
- `idx_ucie_alerts_enabled` - Efficient active alert queries

### ucie_api_costs

**Purpose:** Track API costs for monitoring and optimization

**Columns:**
- `id` - UUID primary key
- `api_name` - API service name (e.g., 'CoinGecko', 'Caesar')
- `endpoint` - Specific endpoint called
- `cost_usd` - Cost in USD (6 decimal places)
- `timestamp` - When API call was made
- `user_id` - Optional user who triggered call
- `symbol` - Optional token symbol analyzed

**Indexes:**
- `idx_ucie_costs_api` - Fast API lookup
- `idx_ucie_costs_timestamp` - Time-based queries
- `idx_ucie_costs_user` - User cost tracking

### ucie_analysis_history

**Purpose:** Track all UCIE analyses for analytics and optimization

**Columns:**
- `id` - UUID primary key
- `user_id` - Optional user who requested analysis
- `symbol` - Token symbol analyzed
- `analysis_type` - Type of analysis performed
- `data_quality_score` - Quality score 0-100
- `response_time_ms` - How long analysis took
- `created_at` - When analysis was performed

**Indexes:**
- `idx_ucie_history_user` - Fast user lookup
- `idx_ucie_history_symbol` - Fast symbol lookup
- `idx_ucie_history_created` - Time-based queries

---

## Next Steps

After successful migration:

### 1. Test UCIE API Endpoints

```bash
# Test health check
curl http://localhost:3000/api/ucie/health

# Test market data
curl http://localhost:3000/api/ucie/market-data/BTC

# Test search
curl http://localhost:3000/api/ucie/search?q=bitcoin
```

### 2. Run Integration Tests

```bash
npm test -- __tests__/api/ucie/
```

### 3. Deploy to Production

```bash
# Commit migration
git add .
git commit -m "feat: Add UCIE database tables"
git push origin main

# Vercel will auto-deploy
```

### 4. Run Migration on Production

After deploying, run the migration on production:

```bash
# Set production DATABASE_URL temporarily
DATABASE_URL="postgres://production..." npx tsx scripts/run-ucie-migration.ts
```

Or use Vercel CLI:

```bash
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npx tsx scripts/run-ucie-migration.ts
```

---

## Rollback (If Needed)

If you need to remove the UCIE tables:

```sql
-- Drop all UCIE tables (CAUTION: This deletes all data!)
DROP TABLE IF EXISTS ucie_alerts CASCADE;
DROP TABLE IF EXISTS ucie_analysis_cache CASCADE;
DROP TABLE IF EXISTS ucie_analysis_history CASCADE;
DROP TABLE IF EXISTS ucie_api_costs CASCADE;
DROP TABLE IF EXISTS ucie_watchlist CASCADE;
```

Then re-run the migration to start fresh.

---

## Support

### Common Issues

1. **Connection issues** - Check DATABASE_URL format and network
2. **Permission issues** - Verify database user has CREATE TABLE rights
3. **Foreign key issues** - Ensure `users` table exists first

### Getting Help

1. Check Vercel function logs
2. Review Supabase database logs
3. Run with verbose mode: `VERBOSE=true npm run migrate:ucie`
4. Check this documentation

### Useful Commands

```bash
# Check migration status
npm run migrate:ucie

# Verbose output
VERBOSE=true npm run migrate:ucie

# Check database connection
npx tsx scripts/check-database-status.ts

# View Supabase logs
# Go to: https://supabase.com/dashboard → Logs
```

---

## Summary

✅ **Automated migration script created**  
✅ **5 UCIE tables defined**  
✅ **15+ indexes for performance**  
✅ **Foreign key constraints for data integrity**  
✅ **Safe to run multiple times**  
✅ **Comprehensive error handling**  
✅ **Detailed verification and reporting**

**Status**: Ready to run!

**Command**: `npm run migrate:ucie`

---

**Last Updated**: January 27, 2025  
**Version**: 1.0.0  
**Spec Location**: `.kiro/specs/universal-crypto-intelligence/`
