# 🗄️ Database Cleanup Guide - ATGE Fresh Testing

**Purpose**: Clean all ATGE trade data for fresh testing  
**Date**: January 27, 2025  
**Status**: Ready to execute

---

## ⚠️ WARNING

**This will DELETE ALL trade data from your database!**

- All trade signals
- All trade results
- All technical indicators
- All market snapshots
- All historical prices

**Tables will remain intact** - only data is deleted.

---

## 🚀 Quick Cleanup (3 steps)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Copy Cleanup Script

Open the file: `scripts/clean-atge-database.sql`

Or copy this:

```sql
BEGIN;

-- Delete all ATGE trade data
DELETE FROM trade_historical_prices;
DELETE FROM trade_market_snapshot;
DELETE FROM trade_technical_indicators;
DELETE FROM trade_results;
DELETE FROM trade_signals;

-- Verify cleanup
SELECT 
  'CLEANUP COMPLETE' as status,
  (SELECT COUNT(*) FROM trade_signals) as trade_signals_count,
  (SELECT COUNT(*) FROM trade_results) as trade_results_count,
  (SELECT COUNT(*) FROM trade_technical_indicators) as indicators_count,
  (SELECT COUNT(*) FROM trade_market_snapshot) as snapshots_count,
  (SELECT COUNT(*) FROM trade_historical_prices) as historical_prices_count;

COMMIT;
```

### Step 3: Execute

1. Paste the script into the SQL Editor
2. Click "Run" (or press Ctrl+Enter)
3. Verify all counts are 0

---

## ✅ Verification

After cleanup, you should see:

```
status: CLEANUP COMPLETE
trade_signals_count: 0
trade_results_count: 0
indicators_count: 0
snapshots_count: 0
historical_prices_count: 0
```

---

## 🔄 What Happens Next

After cleanup, your ATGE system is ready for fresh testing:

1. **Generate new trade signals**
   - Go to ATGE dashboard
   - Click "Generate Trade Signal"
   - System will create fresh trades

2. **Verify trades work**
   - Check trade appears in database
   - Verify all fields populated
   - Test monitoring dashboard

3. **Test verification system**
   - Wait for hourly cron job
   - Or manually trigger verification
   - Check trade results update

---

## 🛡️ Safety Notes

- ✅ Tables remain intact (structure preserved)
- ✅ Indexes remain intact
- ✅ Foreign keys remain intact
- ✅ Triggers remain intact
- ✅ Other data unaffected (users, sessions, etc.)
- ❌ Trade data is permanently deleted

---

## 🔙 Rollback

**There is no rollback!** Data is permanently deleted.

If you need to preserve data:
1. Export data before cleanup
2. Or skip cleanup and test with existing data

---

## 📊 Alternative: Selective Cleanup

If you want to keep some data, modify the script:

```sql
-- Delete only old trades (example: older than 7 days)
DELETE FROM trade_signals 
WHERE generated_at < NOW() - INTERVAL '7 days';

-- Delete only failed trades
DELETE FROM trade_signals 
WHERE status = 'completed_failure';

-- Delete only specific symbol
DELETE FROM trade_signals 
WHERE symbol = 'BTC';
```

---

## 🎯 When to Use Cleanup

**Use cleanup when:**
- Starting fresh testing
- Clearing test data
- Resetting after development
- Preparing for production testing

**Don't use cleanup when:**
- You have production data
- You need historical analysis
- You're debugging specific trades
- You want to preserve metrics

---

## 📞 Support

If cleanup fails:
1. Check Supabase logs
2. Verify database connection
3. Check foreign key constraints
4. Review error messages

---

**Ready to clean?** Follow the 3 steps above! 🗄️

