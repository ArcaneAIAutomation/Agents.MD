# ATGE Production Setup Guide

**Purpose**: Clean database and configure for real user-initiated data  
**Date**: January 2025  
**Status**: Ready for Production Use

---

## 🎯 Overview

This guide will help you:
1. Clean all test data from the database
2. Configure the system for real user-initiated data
3. Verify the system is ready for production use

---

## 🧹 Step 1: Clean the Database

### Run the Cleanup Script

```bash
# Clean all ATGE data from the database
npx tsx scripts/cleanup-atge-database.ts
```

### Expected Output

```
🧹 ATGE Database Cleanup
============================================================
This will delete ALL ATGE data from the database.

Deleting trade historical prices...
✅ Deleted 0 historical price records
Deleting trade technical indicators...
✅ Deleted 0 technical indicator records
Deleting trade market snapshots...
✅ Deleted 0 market snapshot records
Deleting trade results...
✅ Deleted 0 trade result records
Deleting trade signals...
✅ Deleted 0 trade signal records
Deleting performance cache...
✅ Deleted 0 performance cache records
Deleting error logs...
✅ Deleted 0 error log records
Deleting performance metrics...
✅ Deleted 0 performance metric records
Deleting user feedback...
✅ Deleted 0 user feedback records

============================================================
✅ Database cleanup complete!

The ATGE system is now ready for real user-initiated data.
Users can select Bitcoin and click "Generate Trade Signal" to populate the database.

Verification:
┌──────────────────────────┬───┐
│ trade_signals            │ 0 │
│ trade_results            │ 0 │
│ historical_prices        │ 0 │
│ technical_indicators     │ 0 │
│ market_snapshots         │ 0 │
│ performance_cache        │ 0 │
│ error_logs               │ 0 │
│ performance_metrics      │ 0 │
│ user_feedback            │ 0 │
└──────────────────────────┴───┘

✅ All tables are empty. Database is clean!
```

### Manual Verification (Optional)

```bash
# Connect to database
psql "postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres"

# Check table counts
SELECT 
  (SELECT COUNT(*) FROM trade_signals) as trade_signals,
  (SELECT COUNT(*) FROM trade_results) as trade_results,
  (SELECT COUNT(*) FROM trade_historical_prices) as historical_prices,
  (SELECT COUNT(*) FROM atge_performance_cache) as performance_cache;

# Expected: All counts should be 0
```

---

## ⚙️ Step 2: Verify System Configuration

### Auto-Refresh Settings ✅

**Status**: Auto-refresh is now **DISABLED by default** and **greyed out** for users.

**Changes Made**:
1. `PerformanceDashboard.tsx`:
   - Auto-refresh state: `useState(false)` (disabled by default)
   - Auto-refresh button: Disabled and greyed out with `opacity-50`
   - Tooltip: "Auto-refresh is disabled. Use manual refresh instead."

2. Manual refresh button remains **ACTIVE** and available for users

### User Flow ✅

**How Users Will Populate the Database**:

1. **User logs in** to the platform
2. **User navigates** to the ATGE page
3. **User selects** Bitcoin (BTC) from the cryptocurrency selector
4. **User clicks** "Generate Trade Signal" button
5. **System generates** trade signal with:
   - Real market data from CoinMarketCap/CoinGecko
   - Real social sentiment from LunarCrush
   - Real technical indicators
   - AI analysis from GPT-4o
   - Backtesting with real historical data
6. **System stores** all data in the database
7. **Page refreshes** automatically to show new data
8. **User can manually refresh** to see updated performance metrics

---

## 🚀 Step 3: Test the System

### Test User Flow

1. **Clean the database** (if not already done):
   ```bash
   npx tsx scripts/cleanup-atge-database.ts
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open the browser**:
   ```
   http://localhost:3000/atge
   ```

4. **Log in** with your credentials

5. **Select Bitcoin** (BTC)

6. **Click "Generate Trade Signal"**

7. **Wait for generation** (10-30 seconds):
   - Fetching market data
   - Fetching social sentiment
   - Calculating technical indicators
   - Generating AI analysis
   - Running backtesting

8. **Verify success message**:
   ```
   ✅ Trade signal generated successfully! Check the trade history below.
   ```

9. **Page auto-refreshes** (after 2 seconds)

10. **Verify data is displayed**:
    - Performance dashboard shows statistics
    - Trade history table shows the new trade
    - All data is real (not test data)

### Verify Database Population

```bash
# Connect to database
psql "postgres://..."

# Check trade signals
SELECT id, symbol, direction, entry_price, confidence_score, status, generated_at
FROM trade_signals
ORDER BY generated_at DESC
LIMIT 5;

# Check market snapshot
SELECT 
  ts.id,
  ts.symbol,
  tms.current_price,
  tms.galaxy_score,
  tms.social_sentiment_score,
  tms.whale_transactions_24h
FROM trade_signals ts
JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
ORDER BY ts.generated_at DESC
LIMIT 5;

# Check technical indicators
SELECT 
  ts.id,
  ts.symbol,
  tti.rsi_14,
  tti.macd_line,
  tti.ema_20,
  tti.ema_50
FROM trade_signals ts
JOIN trade_technical_indicators tti ON ts.id = tti.trade_signal_id
ORDER BY ts.generated_at DESC
LIMIT 5;
```

---

## 📊 Step 4: Monitor Production Usage

### Real-Time Monitoring

```bash
# Run health check
npx tsx scripts/atge-health-check.ts

# Generate performance report
npx tsx scripts/atge-performance-report.ts
```

### Database Monitoring

```sql
-- Check recent trades
SELECT 
  COUNT(*) as total_trades,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'completed_success') as successful,
  COUNT(*) FILTER (WHERE status = 'completed_failure') as failed
FROM trade_signals
WHERE generated_at > NOW() - INTERVAL '24 hours';

-- Check data quality
SELECT 
  ts.id,
  ts.symbol,
  tms.data_quality_score,
  tms.data_sources
FROM trade_signals ts
JOIN trade_market_snapshot tms ON ts.id = tms.trade_signal_id
ORDER BY ts.generated_at DESC
LIMIT 10;

-- Check error logs
SELECT * FROM atge_error_logs
ORDER BY timestamp DESC
LIMIT 10;
```

---

## ✅ Production Readiness Checklist

### Database
- [x] All test data cleaned
- [x] All tables empty and ready
- [x] Indexes optimized
- [x] Views accessible

### System Configuration
- [x] Auto-refresh disabled by default
- [x] Auto-refresh button greyed out
- [x] Manual refresh available
- [x] Real API endpoints connected

### User Experience
- [x] User must select cryptocurrency (Bitcoin)
- [x] User must click "Generate Trade Signal"
- [x] System fetches real data from APIs
- [x] System stores data in database
- [x] Page auto-refreshes to show new data
- [x] User can manually refresh

### Data Sources
- [x] CoinMarketCap API (market data)
- [x] CoinGecko API (backup market data)
- [x] LunarCrush API (social sentiment)
- [x] OpenAI GPT-4o (AI analysis)
- [x] Real historical data (backtesting)

### Monitoring
- [x] Error logging enabled
- [x] Performance tracking enabled
- [x] Health check script ready
- [x] Performance report script ready

---

## 🎯 Expected User Experience

### First-Time User

1. **Logs in** to the platform
2. **Sees empty dashboard** (no trades yet)
3. **Selects Bitcoin** from dropdown
4. **Clicks "Generate Trade Signal"**
5. **Waits 10-30 seconds** for generation
6. **Sees success message** and page refreshes
7. **Sees first trade** in trade history
8. **Sees performance metrics** updated

### Returning User

1. **Logs in** to the platform
2. **Sees existing trades** in trade history
3. **Sees performance dashboard** with statistics
4. **Can generate new trade** by clicking button
5. **Can manually refresh** to see updated data
6. **Auto-refresh is disabled** (greyed out)

---

## 🔧 Troubleshooting

### Issue: No Data After Generation

**Symptoms**: User clicks "Generate Trade Signal" but no data appears

**Diagnosis**:
```bash
# Check error logs
psql "postgres://..." -c "SELECT * FROM atge_error_logs ORDER BY timestamp DESC LIMIT 5"

# Check API logs
vercel logs --filter /api/atge/generate
```

**Solutions**:
1. Verify API keys are set (OpenAI, CoinMarketCap, LunarCrush)
2. Check database connection
3. Verify user is authenticated
4. Check browser console for errors

### Issue: Auto-Refresh Still Enabled

**Symptoms**: Auto-refresh button is not greyed out

**Diagnosis**:
```bash
# Check component code
grep -n "autoRefresh" components/ATGE/PerformanceDashboard.tsx
```

**Solutions**:
1. Verify `useState(false)` is set (line 48)
2. Verify `disabled={true}` is set on button
3. Clear browser cache and reload
4. Rebuild the application: `npm run build`

### Issue: Page Doesn't Refresh After Generation

**Symptoms**: Success message appears but data doesn't update

**Diagnosis**:
```bash
# Check browser console for errors
# Check if window.location.reload() is called
```

**Solutions**:
1. Verify `window.location.reload()` is in the success handler
2. Check if there are JavaScript errors preventing reload
3. Manually refresh the page

---

## 📝 Summary

### What Changed

1. **Database**: Cleaned all test data
2. **Auto-Refresh**: Disabled by default, greyed out
3. **Manual Refresh**: Available and active
4. **User Flow**: User-initiated data population
5. **Real Data**: All data comes from real APIs

### What Users Will See

1. **Empty dashboard** on first visit
2. **Bitcoin selector** (Ethereum coming soon)
3. **Generate button** to create trade signals
4. **Real-time generation** with progress indicator
5. **Success message** when complete
6. **Auto page refresh** to show new data
7. **Manual refresh button** to update metrics
8. **Greyed out auto-refresh** (disabled)

### Production Status

**Status**: ✅ **READY FOR PRODUCTION**

The ATGE system is now configured for real user-initiated data population. Users will generate trade signals by selecting Bitcoin and clicking the "Generate Trade Signal" button. All data will be real and stored in the database.

---

**Next Steps**:
1. Deploy to production: `vercel --prod`
2. Monitor user activity
3. Collect feedback
4. Optimize performance

**The system is production-ready!** 🚀
