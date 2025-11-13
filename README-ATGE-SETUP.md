# ATGE Setup Guide - Quick Start

**AI Trade Generation Engine (Bitcoin Only)**  
**Date**: January 27, 2025  
**Status**: Ready to Deploy

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Database Migration

```bash
npx tsx scripts/run-atge-migration.ts
```

**What this does**:
- Creates 6 database tables
- Creates 20+ indexes
- Creates 3 triggers
- Creates 1 view
- Creates 1 function
- Verifies everything works

**Expected output**:
```
✅ trade_signals
✅ trade_results
✅ trade_technical_indicators
✅ trade_market_snapshot
✅ trade_historical_prices
✅ atge_performance_cache
✅ vw_complete_trades
✅ calculate_atge_performance()
✅ 20+ indexes created
✅ 3 triggers created
```

### Step 2: Verify Database

```bash
# Quick verification query
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'trade_%' OR table_name LIKE 'atge_%';"
```

**Expected**: 6 tables listed

---

## 📊 What Was Created

### Database Tables (6)

1. **trade_signals** - AI-generated trade predictions
   - Entry price, 3 take profits, stop loss
   - Confidence score, AI reasoning
   - Status tracking, timestamps

2. **trade_results** - Backtesting outcomes
   - Which targets hit, when, at what price
   - Profit/loss calculations ($1000 trade size)
   - Fees and slippage included
   - AI analysis of outcome

3. **trade_technical_indicators** - Technical analysis
   - RSI, MACD, EMAs, Bollinger Bands
   - ATR, Stochastic, Volume
   - Snapshot at trade generation time

4. **trade_market_snapshot** - Market state + social intelligence
   - Price, volume, market cap
   - Fear & Greed Index
   - **LunarCrush metrics** (Galaxy Score, AltRank, sentiment, social volume)
   - On-chain data (whale transactions, exchange flows)

5. **trade_historical_prices** - OHLCV data
   - Minute-level price data
   - Used for backtesting
   - Stored per trade

6. **atge_performance_cache** - Performance statistics
   - Success rate, total P/L
   - Best/worst trades
   - Advanced metrics (Sharpe ratio, drawdown)
   - Social intelligence performance

### Database Features

- ✅ **20+ indexes** for fast queries
- ✅ **3 triggers** for automatic timestamps
- ✅ **1 view** (`vw_complete_trades`) for easy data access
- ✅ **1 function** (`calculate_atge_performance`) for stats calculation
- ✅ **Foreign keys** with CASCADE delete
- ✅ **Check constraints** for data validation
- ✅ **Unique constraints** to prevent duplicates

---

## 🎯 Key Features

### Bitcoin-Only Focus
- Optimized for single cryptocurrency
- Simpler, faster implementation
- Ethereum support deferred to future

### LunarCrush Social Intelligence
- Galaxy Score (0-100 health metric)
- AltRank (market position)
- Social dominance (market attention)
- Sentiment distribution (crowd sentiment)
- Social volume (activity metrics)
- Correlation score (predictive power)

### Complete Trade Tracking
- Every trade stored separately
- Full context at generation time
- Backtesting with real data
- AI analysis of outcomes
- 100% transparency

### Production-Ready
- Optimized queries
- Automatic updates
- Data integrity
- Performance cache
- Scalable design

---

## 📁 Files Created

### Migration
- `migrations/002_create_atge_tables.sql` (600+ lines)
- `scripts/run-atge-migration.ts` (automated deployment)

### Documentation
- `ATGE-BITCOIN-FOCUS-UPDATE.md` (detailed changes)
- `ATGE-NEXT-STEPS.md` (implementation guide)
- `ATGE-IMPLEMENTATION-SUMMARY.md` (complete summary)
- `README-ATGE-SETUP.md` (this file)

### Tasks Updated
- `.kiro/specs/ai-trade-generation-engine/tasks.md` (Bitcoin focus)

---

## 🔄 Next Steps

### Immediate (After Migration)
1. ✅ Verify all tables created
2. ✅ Test database functions
3. ✅ Confirm indexes working

### Phase 2: LunarCrush Integration (2-3 hours)
1. Update `lib/atge/sentimentData.ts`
2. Use MCP tools instead of REST API
3. Extract all social intelligence metrics
4. Store in database

### Phase 3: Database Utilities (1-2 hours)
1. Create `lib/atge/database.ts`
2. Implement all CRUD functions
3. Test with sample data

### Phase 4: AI Integration (30 minutes)
1. Update AI prompt with social context
2. Weight social signals at 30-40%
3. Test trade generation

### Phase 5: Frontend (2-3 hours)
1. Create LunarCrush metrics component
2. Add to trade interface
3. Add to performance dashboard

**Total Time**: 8-12 hours to complete ATGE

---

## 📋 Verification Checklist

After running migration:

- [ ] All 6 tables exist
- [ ] All indexes created (20+)
- [ ] All triggers working (3)
- [ ] View `vw_complete_trades` exists
- [ ] Function `calculate_atge_performance` exists
- [ ] Can insert test trade signal
- [ ] Can insert test results
- [ ] Can insert test indicators
- [ ] Can insert test snapshot with LunarCrush data
- [ ] Can insert test historical prices
- [ ] Performance cache updates correctly
- [ ] View returns complete trade data
- [ ] Function calculates stats correctly

---

## 🆘 Troubleshooting

### Migration Fails

**Error**: "relation already exists"
```bash
# Drop existing tables (CAUTION: deletes data)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS trade_signals, trade_results, trade_technical_indicators, trade_market_snapshot, trade_historical_prices, atge_performance_cache CASCADE;"

# Then re-run migration
npx tsx scripts/run-atge-migration.ts
```

### Connection Issues

**Error**: "connection timeout"
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Permission Issues

**Error**: "permission denied"
```bash
# Ensure user has CREATE TABLE permission
# Contact Supabase admin or check project settings
```

---

## 📚 Documentation

### Spec Documents
- [Tasks](.kiro/specs/ai-trade-generation-engine/tasks.md)
- [Requirements](.kiro/specs/ai-trade-generation-engine/requirements.md)
- [Design](.kiro/specs/ai-trade-generation-engine/design.md)

### Implementation Guides
- [Bitcoin Focus Update](ATGE-BITCOIN-FOCUS-UPDATE.md)
- [Next Steps](ATGE-NEXT-STEPS.md)
- [Implementation Summary](ATGE-IMPLEMENTATION-SUMMARY.md)

### Database
- [Migration SQL](migrations/002_create_atge_tables.sql)
- [Migration Script](scripts/run-atge-migration.ts)

---

## 💡 Key Decisions

1. **Bitcoin-Only**: Simpler, faster, launch sooner
2. **LunarCrush**: Superior social intelligence
3. **Separate Tables**: Better organization, easier queries
4. **Performance Cache**: Fast dashboard loading
5. **$1000 Trade Size**: Consistent P/L calculations

---

## 🎉 Ready to Go!

Everything is prepared and ready to deploy. Just run:

```bash
npx tsx scripts/run-atge-migration.ts
```

And you'll have a complete ATGE database foundation ready for implementation!

---

**Status**: 🟢 Ready to Deploy  
**Priority**: HIGH  
**Estimated Time**: 5 minutes  
**Confidence**: 100%

**Let's build the future of AI-powered crypto trading!** 🚀
