# UCIE Automated Database Setup

**Last Updated**: January 27, 2025  
**Status**: ✅ READY TO USE  
**Version**: 2.0

---

## 🎯 Overview

This guide provides **fully automated** database setup for the UCIE system. One command creates all tables, runs migrations, and verifies everything works.

---

## 🚀 Quick Start (One Command)

### Complete Setup and Test

```bash
npm run setup:ucie:full
```

**This single command will:**
1. ✅ Create all 6 UCIE database tables
2. ✅ Run all migrations (005, 006)
3. ✅ Create indexes for performance
4. ✅ Add sample test entries
5. ✅ Run 10 comprehensive tests
6. ✅ Test data replacement functionality
7. ✅ Verify UPSERT operations
8. ✅ Display complete summary

**Expected Output:**
```
🚀 UCIE Complete Setup and Test
============================================================
This will:
1. Create all database tables
2. Run all migrations
3. Test all functionality
4. Verify everything works
============================================================

📦 Step 1: Setting up database...
✅ Database connection successful
✅ Migration 005_openai_caesar_tables.sql completed
✅ Migration 006_add_ai_provider_column.sql completed
✅ All required tables exist

🧪 Step 2: Testing database...
✅ Passed: 10/10
🎉 ALL TESTS PASSED!

🔄 Step 3: Testing data replacement...
✅ OpenAI analysis storage and replacement
✅ Caesar research storage and replacement
✅ Complete analysis retrieval
✅ Data cleanup

============================================================
🎉 COMPLETE SETUP AND TEST SUCCESSFUL!
============================================================
```

---

## 📋 Individual Commands

### 1. Setup Only (No Tests)

```bash
npm run setup:ucie
```

**What it does:**
- Creates all database tables
- Runs migrations
- Creates sample entries
- Verifies table structure

**Use when:** You just want to set up the database without running tests.

### 2. Test Only (Assumes Setup Done)

```bash
npm run test:ucie
```

**What it does:**
- Tests database connection
- Tests table existence
- Tests UPSERT operations
- Tests data replacement
- Tests concurrent updates

**Use when:** Database is already set up and you want to verify it works.

### 3. Manual Migration

```bash
# Run specific migration
npx tsx migrations/005_openai_caesar_tables.sql
npx tsx migrations/006_add_ai_provider_column.sql
```

**Use when:** You want to run migrations manually.

---

## 📊 What Gets Created

### Database Tables (6 Total)

#### 1. `ucie_analysis_cache`
**Purpose**: Cache for all API data (market, sentiment, news, etc.)

**Columns**:
- `id` - Primary key
- `symbol` - Crypto symbol (BTC, ETH)
- `analysis_type` - Type of data (market-data, sentiment, etc.)
- `data` - JSON data from APIs
- `data_quality_score` - Quality score (0-100)
- `user_id` - User identifier
- `user_email` - User email
- `expires_at` - Cache expiration
- `created_at` - Creation timestamp

**Unique Constraint**: `(symbol, analysis_type, user_id)`  
**Result**: UPSERT replaces old data automatically

#### 2. `ucie_openai_analysis`
**Purpose**: Store OpenAI/Gemini AI summaries

**Columns**:
- `id` - Primary key
- `symbol` - Crypto symbol
- `user_id` - User identifier
- `user_email` - User email
- `summary_text` - AI-generated summary
- `data_quality_score` - Quality score
- `api_status` - Which APIs succeeded/failed
- `ai_provider` - 'openai' or 'gemini'
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Unique Constraint**: `(symbol, user_id)`  
**Result**: UPSERT replaces old summaries automatically

#### 3. `ucie_caesar_research`
**Purpose**: Store complete Caesar AI research

**Columns**:
- `id` - Primary key
- `symbol` - Crypto symbol
- `user_id` - User identifier
- `user_email` - User email
- `job_id` - Caesar AI job ID
- `status` - Job status (queued, researching, completed)
- `research_data` - Full Caesar AI response (JSON)
- `executive_summary` - Summary text
- `key_findings` - Array of findings
- `opportunities` - Array of opportunities
- `risks` - Array of risks
- `recommendation` - BUY/SELL/HOLD
- `confidence_score` - Confidence (0-100)
- `sources` - Array of source citations
- `source_count` - Number of sources
- `data_quality_score` - Quality score
- `analysis_depth` - Depth level
- `started_at` - Job start time
- `completed_at` - Job completion time
- `duration_seconds` - Job duration
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Unique Constraint**: `(symbol, user_id)`  
**Result**: UPSERT replaces old research automatically

#### 4. `ucie_phase_data`
**Purpose**: Session-based phase data (temporary storage)

**Columns**:
- `id` - Primary key
- `session_id` - Session identifier
- `symbol` - Crypto symbol
- `phase` - Phase number (1-4)
- `data` - Phase data (JSON)
- `expires_at` - Expiration (1 hour)
- `created_at` - Creation timestamp

#### 5. `ucie_watchlist`
**Purpose**: User watchlists

**Columns**:
- `id` - Primary key
- `user_id` - User identifier
- `symbol` - Crypto symbol
- `created_at` - Creation timestamp

#### 6. `ucie_alerts`
**Purpose**: User alerts and notifications

**Columns**:
- `id` - Primary key
- `user_id` - User identifier
- `symbol` - Crypto symbol
- `alert_type` - Alert type
- `threshold` - Alert threshold
- `created_at` - Creation timestamp

### Indexes Created

**Performance indexes for fast queries:**
- `idx_ucie_analysis_cache_symbol_type_user` - Fast cache lookups
- `idx_ucie_analysis_cache_expires_at` - Fast expiration checks
- `idx_ucie_openai_analysis_symbol_user` - Fast OpenAI lookups
- `idx_ucie_openai_analysis_ai_provider` - Fast provider filtering
- `idx_ucie_caesar_research_symbol_user` - Fast Caesar lookups
- `idx_ucie_caesar_research_status` - Fast status filtering
- `idx_ucie_phase_data_session_symbol` - Fast phase lookups
- `idx_ucie_phase_data_expires_at` - Fast expiration checks

---

## 🧪 Tests Performed

### Automated Test Suite (10 Tests)

1. **Database Connection** - Verifies connection works
2. **Table Existence** - Checks all 6 tables exist
3. **Cache Storage (UPSERT)** - Tests cache replacement
4. **OpenAI Analysis Storage (UPSERT)** - Tests OpenAI replacement
5. **Gemini Analysis Storage (UPSERT)** - Tests Gemini replacement
6. **Caesar Research Storage (UPSERT)** - Tests Caesar replacement
7. **Complete Analysis Retrieval** - Tests fetching all data
8. **Data Cleanup** - Tests deletion works
9. **Index Performance** - Verifies indexes exist
10. **Concurrent UPSERT** - Tests race conditions

### Data Replacement Tests

1. **OpenAI Replacement** - Stores twice, verifies only 1 entry
2. **Caesar Replacement** - Stores twice, verifies only 1 entry
3. **Complete Analysis** - Retrieves both OpenAI and Caesar
4. **Cleanup** - Deletes test data

---

## 🔧 Troubleshooting

### Issue 1: Database Connection Failed

**Error**: `Connection timeout` or `ECONNREFUSED`

**Solution**:
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT NOW()"

# Verify Supabase database is running
# Go to https://supabase.com/dashboard
```

### Issue 2: Tables Already Exist

**Error**: `relation "ucie_openai_analysis" already exists`

**Solution**: This is OK! The script uses `CREATE TABLE IF NOT EXISTS`, so it won't fail if tables exist.

### Issue 3: Migration Failed

**Error**: `Migration 005_openai_caesar_tables.sql failed`

**Solution**:
```bash
# Check migration file exists
ls migrations/005_openai_caesar_tables.sql

# Run migration manually
psql $DATABASE_URL -f migrations/005_openai_caesar_tables.sql

# Check for syntax errors in SQL file
```

### Issue 4: Tests Failed

**Error**: `❌ Failed: 2/10`

**Solution**:
```bash
# Run tests with verbose output
npm run test:ucie

# Check which specific test failed
# Review error message
# Fix the issue
# Re-run tests
```

### Issue 5: Permission Denied

**Error**: `permission denied for table ucie_openai_analysis`

**Solution**:
```bash
# Grant permissions to your database user
psql $DATABASE_URL -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;"
psql $DATABASE_URL -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_user;"
```

---

## 📊 Verification

### Check Tables Exist

```bash
psql $DATABASE_URL -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'ucie_%'
ORDER BY table_name;
"
```

**Expected Output:**
```
       table_name        
-------------------------
 ucie_alerts
 ucie_analysis_cache
 ucie_caesar_research
 ucie_openai_analysis
 ucie_phase_data
 ucie_watchlist
(6 rows)
```

### Check Indexes Exist

```bash
psql $DATABASE_URL -c "
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'ucie_%'
ORDER BY tablename, indexname;
"
```

**Expected**: 8+ indexes

### Check Sample Data

```bash
psql $DATABASE_URL -c "
SELECT symbol, analysis_type, user_id 
FROM ucie_analysis_cache 
LIMIT 5;
"
```

**Expected**: At least 1 sample entry (symbol='BTC', user_id='system')

---

## 🎯 Next Steps

### After Successful Setup

1. **Start Development Server**:
```bash
npm run dev
```

2. **Test UCIE Endpoints**:
```bash
# Test market data
curl http://localhost:3000/api/ucie/market-data/BTC

# Test OpenAI summary
curl http://localhost:3000/api/ucie/openai-summary/BTC

# Test Gemini summary
curl http://localhost:3000/api/ucie/gemini-summary/BTC

# Test Caesar research
curl -X POST http://localhost:3000/api/ucie/caesar-research/BTC
```

3. **Deploy to Production**:
```bash
npm run deploy
```

---

## 📋 Environment Variables Required

```bash
# Database (Required)
DATABASE_URL=postgres://user:pass@host:6543/postgres

# AI APIs (Required)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
CAESAR_API_KEY=...

# Market Data APIs (Required)
COINMARKETCAP_API_KEY=...
COINGECKO_API_KEY=...

# News APIs (Required)
NEWS_API_KEY=...

# Social APIs (Optional)
LUNARCRUSH_API_KEY=...
TWITTER_BEARER_TOKEN=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...

# Blockchain APIs (Optional)
ETHERSCAN_API_KEY=...
BLOCKCHAIN_API_KEY=...
```

---

## 🎉 Success Criteria

### ✅ Setup is successful when:

- [ ] All 6 tables created
- [ ] All migrations completed
- [ ] All indexes created
- [ ] Sample entries created
- [ ] 10/10 tests passed
- [ ] Data replacement tests passed
- [ ] No errors in output

### ✅ System is ready when:

- [ ] Database connection works
- [ ] UPSERT operations replace old data
- [ ] No duplicate entries created
- [ ] OpenAI/Gemini summaries stored
- [ ] Caesar research stored
- [ ] Complete analysis retrieval works

---

## 📚 Related Documentation

- **UCIE System Guide**: `.kiro/steering/ucie-system.md`
- **Data Replacement Guide**: `UCIE-DATA-REPLACEMENT-GUIDE.md`
- **Improvements Guide**: `UCIE-IMPROVEMENTS-GUIDE.md`
- **API Integration**: `.kiro/steering/api-integration.md`

---

## 🚀 Summary

**One command sets up everything:**
```bash
npm run setup:ucie:full
```

**Result:**
- ✅ 6 tables created
- ✅ 8+ indexes created
- ✅ 2 migrations run
- ✅ 10 tests passed
- ✅ Data replacement verified
- ✅ System ready to use

**Time**: ~30 seconds  
**Effort**: Zero (fully automated)  
**Result**: Production-ready UCIE database

---

**Status**: ✅ **AUTOMATED AND READY**  
**Command**: `npm run setup:ucie:full`  
**Time**: 30 seconds  
**Effort**: Zero

**One command. Everything automated. Ready to use.** 🚀
