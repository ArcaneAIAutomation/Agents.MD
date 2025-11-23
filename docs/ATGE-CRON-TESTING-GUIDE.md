# ATGE Cron Job Testing Guide

## Overview

This guide provides instructions for testing the ATGE trade verification cron job locally before deploying to production.

**Cron Endpoint**: `/api/cron/atge-verify-trades`  
**Schedule**: Every hour at minute 0 (`0 * * * *`)  
**Requirements**: 2.1

---

## Prerequisites

1. **Environment Variables**:
   ```bash
   CRON_SECRET=your-32-byte-random-string-here
   DATABASE_URL=postgres://...
   COINMARKETCAP_API_KEY=...
   COINGECKO_API_KEY=...
   ```

2. **Database**: Ensure `trade_signals` and `trade_results` tables exist

3. **Local Server**: Start the development server
   ```bash
   npm run dev
   ```

---

## Manual Testing

### Test 1: Trigger Cron Endpoint with CRON_SECRET

**Purpose**: Verify the cron endpoint accepts authorized requests

```bash
curl -X POST http://localhost:3000/api/cron/atge-verify-trades \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Successfully verified X trades, Y updated",
  "verification": {
    "totalTrades": 10,
    "verified": 10,
    "updated": 2,
    "failed": 0,
    "errors": [],
    "timestamp": "2025-11-23T02:00:00.000Z"
  }
}
```

---

### Test 2: Trigger Without Auth (Should Fail)

**Purpose**: Verify the cron endpoint rejects unauthorized requests

```bash
curl -X POST http://localhost:3000/api/cron/atge-verify-trades \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Expected Status**: `401 Unauthorized`

---

### Test 3: Verify Trades are Verified Correctly

**Purpose**: Verify the cron job correctly checks trade targets

**Steps**:

1. Create test trades in database:
   ```sql
   INSERT INTO trade_signals (
     user_id, symbol, timeframe, timeframe_hours,
     entry_price, tp1_price, tp1_allocation,
     tp2_price, tp2_allocation, tp3_price, tp3_allocation,
     stop_loss_price, stop_loss_percentage,
     confidence_score, risk_reward_ratio,
     market_condition, status, expires_at, generated_at, ai_reasoning
   )
   VALUES (
     'USER_ID_HERE', 'BTC', '1h', 1,
     95000, 96000, 33.33,
     97000, 33.33, 98000, 33.34,
     94000, 1.05,
     85, 3.0,
     'BULLISH', 'active', NOW() + INTERVAL '24 hours', NOW(),
     'Test trade for cron job verification'
   );
   ```

2. Trigger cron job:
   ```bash
   curl -X POST http://localhost:3000/api/cron/atge-verify-trades \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

3. Check database for updates:
   ```sql
   SELECT 
     id, symbol, status,
     tp1_hit, tp2_hit, tp3_hit, stop_loss_hit
   FROM trade_signals
   WHERE id = 'TRADE_ID_HERE';
   
   SELECT *
   FROM trade_results
   WHERE trade_signal_id = 'TRADE_ID_HERE';
   ```

**Expected**: Trade status updated based on current market price

---

### Test 4: Test Expired Trade Handling

**Purpose**: Verify expired trades are marked correctly

**Steps**:

1. Create expired test trade:
   ```sql
   INSERT INTO trade_signals (
     user_id, symbol, timeframe, timeframe_hours,
     entry_price, tp1_price, tp1_allocation,
     tp2_price, tp2_allocation, tp3_price, tp3_allocation,
     stop_loss_price, stop_loss_percentage,
     confidence_score, risk_reward_ratio,
     market_condition, status, expires_at, generated_at, ai_reasoning
   )
   VALUES (
     'USER_ID_HERE', 'BTC', '1h', 1,
     95000, 96000, 33.33,
     97000, 33.33, 98000, 33.34,
     94000, 1.05,
     85, 3.0,
     'BULLISH', 'active', NOW() - INTERVAL '1 hour', NOW(),
     'Expired test trade'
   );
   ```

2. Trigger cron job

3. Verify trade status:
   ```sql
   SELECT id, symbol, status, expires_at
   FROM trade_signals
   WHERE id = 'TRADE_ID_HERE';
   ```

**Expected**: Trade status = `'expired'`

---

### Test 5: Test with Multiple Active Trades

**Purpose**: Verify the cron job can handle multiple trades efficiently

**Steps**:

1. Create 5-10 test trades with different symbols and timeframes

2. Trigger cron job

3. Check verification summary:
   - `totalTrades` should match number of active trades
   - `verified` should equal `totalTrades`
   - `failed` should be 0
   - Execution time should be < 30 seconds

**Expected**: All trades verified successfully within 30 seconds

---

### Test 6: Test Retry Logic

**Purpose**: Verify the cron job retries on failure

**Note**: The retry logic is built into the cron endpoint. If verification fails, it will automatically retry after 5 minutes.

**To test manually**:

1. Trigger cron job with `retry=true` parameter:
   ```bash
   curl -X POST "http://localhost:3000/api/cron/atge-verify-trades?retry=true" \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

2. Check response for `retryAttempt` field

**Expected**: Retry attempt is handled correctly

---

### Test 7: Check for Errors in Response

**Purpose**: Verify error handling and reporting

**Steps**:

1. Trigger cron job

2. Check `verification.errors` array in response

3. Check Vercel logs for detailed error messages

**Expected**: 
- Errors are logged clearly
- System continues processing other trades after errors
- Error messages are descriptive

---

## Vercel Logs Monitoring

### View Logs in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments" → Latest deployment
4. Click "Functions" → `/api/cron/atge-verify-trades`
5. View execution logs

### Key Log Messages to Look For

✅ **Success Messages**:
```
🔄 [ATGE Cron] Trade verification cron job triggered
📊 [ATGE Cron] Verification summary: { totalTrades: 10, verified: 10, updated: 2, failed: 0 }
```

❌ **Error Messages**:
```
⚠️ [ATGE Cron] Unauthorized cron request attempt
❌ [ATGE Cron] Trade verification failed: <error>
⚠️ [ATGE Cron] Verification failed, scheduling retry in 5 minutes
```

---

## Production Testing

### After Deployment

1. **Verify Cron Job is Scheduled**:
   - Go to Vercel Dashboard → Project → Settings → Cron Jobs
   - Confirm `/api/cron/atge-verify-trades` is listed
   - Confirm schedule is `0 * * * *` (hourly)

2. **Manual Trigger in Production**:
   ```bash
   curl -X POST https://your-domain.com/api/cron/atge-verify-trades \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

3. **Monitor First Automatic Run**:
   - Wait for next hour (e.g., 3:00 PM)
   - Check Vercel logs immediately after
   - Verify trades were verified correctly

4. **Check Database**:
   ```sql
   SELECT 
     COUNT(*) as total_trades,
     SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
     SUM(CASE WHEN status = 'completed_success' THEN 1 ELSE 0 END) as completed_success,
     SUM(CASE WHEN status = 'completed_failure' THEN 1 ELSE 0 END) as completed_failure,
     SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
   FROM trade_signals;
   ```

---

## Troubleshooting

### Issue: "Unauthorized" Error

**Cause**: CRON_SECRET not configured or incorrect

**Solution**:
1. Check `.env.local` has `CRON_SECRET` set
2. Verify Vercel environment variables include `CRON_SECRET`
3. Ensure Authorization header format: `Bearer YOUR_SECRET`

---

### Issue: "Failed to fetch price" Errors

**Cause**: Market data API failures

**Solution**:
1. Check `COINMARKETCAP_API_KEY` is valid
2. Check `COINGECKO_API_KEY` is configured as fallback
3. Verify API rate limits not exceeded
4. Check Vercel logs for specific API errors

---

### Issue: Trades Not Being Updated

**Cause**: Current price not hitting any targets

**Solution**:
1. Check current market price vs trade targets
2. Verify trade is not expired
3. Check `trade_results` table for existing hits
4. Review cron job logs for verification details

---

### Issue: Timeout Errors

**Cause**: Too many trades or slow API responses

**Solution**:
1. Check number of active trades (should be < 100)
2. Verify API response times
3. Consider upgrading to Vercel Pro for longer execution time (60s)
4. Optimize database queries with indexes

---

## Performance Benchmarks

### Expected Performance

- **Execution Time**: < 30 seconds for 100 trades
- **API Calls**: 1-2 per trade (CoinMarketCap + fallback)
- **Database Queries**: 3-5 per trade
- **Success Rate**: > 95%

### Monitoring Metrics

Track these metrics in production:

1. **Execution Time**: Average time per cron run
2. **Verification Rate**: % of trades successfully verified
3. **API Failure Rate**: % of API calls that fail
4. **Update Rate**: % of trades that get status updates

---

## Automated Testing Script

A comprehensive test script is available at `scripts/test-atge-cron.ts`.

**Note**: This script requires the local server to be running and test trades to be created in the database.

**Run the script**:
```bash
npm run dev  # In one terminal
npx tsx scripts/test-atge-cron.ts  # In another terminal
```

---

## Summary

The ATGE cron job testing involves:

1. ✅ Manual endpoint testing with/without auth
2. ✅ Database verification of trade updates
3. ✅ Expired trade handling
4. ✅ Multiple trade processing
5. ✅ Retry logic verification
6. ✅ Error handling and logging
7. ✅ Production monitoring

**All tests should pass before deploying to production.**

---

**Last Updated**: November 23, 2025  
**Requirements**: 2.1  
**Status**: ✅ Ready for Testing
