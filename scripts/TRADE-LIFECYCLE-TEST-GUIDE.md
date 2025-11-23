# ATGE Trade Lifecycle Test Guide

This guide provides step-by-step instructions for manually testing the complete ATGE trade lifecycle.

## Prerequisites

1. **Running Development Server**
   ```bash
   npm run dev
   ```

2. **Logged In User**
   - Navigate to http://localhost:3000
   - Log in with valid credentials
   - Ensure you have access to ATGE features

3. **Database Access**
   - Ensure DATABASE_URL is configured in .env.local
   - Database should be accessible

## Test Steps

### Step 1: Generate Trade Signal with GPT-5.1

**Action**: Generate a new trade signal via the ATGE interface

1. Navigate to the ATGE Trade Generation Engine page
2. Select symbol: **BTC** or **ETH**
3. Select timeframe: **1h** (recommended for testing)
4. Click "Generate Trade Signal"
5. Wait for the signal to be generated (5-10 seconds)

**Expected Result**:
- ✅ Trade signal is displayed with:
  - Entry price
  - TP1, TP2, TP3 prices
  - Stop loss price
  - Confidence score
  - Risk/reward ratio
  - AI reasoning
- ✅ Success message appears
- ✅ Trade ID is visible

**Record**: Note the Trade ID for subsequent steps

---

### Step 2: Verify Trade is Stored in Database

**Action**: Query the database to confirm the trade was stored

```sql
SELECT 
  id,
  symbol,
  status,
  entry_price,
  tp1_price,
  tp2_price,
  tp3_price,
  stop_loss_price,
  confidence_score,
  ai_model_version,
  generated_at
FROM trade_signals
WHERE id = 'YOUR_TRADE_ID'
ORDER BY generated_at DESC
LIMIT 1;
```

**Expected Result**:
- ✅ Trade record exists in `trade_signals` table
- ✅ Status is `'active'`
- ✅ All price fields are populated
- ✅ AI model version is `'OpenAI GPT-5.1 + Google Gemini 2.5 Pro'`
- ✅ `generated_at` timestamp is recent

---

### Step 3: Manually Trigger Trade Verification

**Action**: Call the verification endpoint to check trade status

**Option A: Using Browser (if logged in)**
```
http://localhost:3000/api/atge/verify-trades
```

**Option B: Using curl (with auth token)**
```bash
curl -X POST http://localhost:3000/api/atge/verify-trades \
  -H "Cookie: auth_token=YOUR_AUTH_TOKEN"
```

**Expected Result**:
```json
{
  "success": true,
  "totalTrades": 1,
  "verified": 1,
  "updated": 0,
  "failed": 0,
  "errors": [],
  "timestamp": "2025-01-27T..."
}
```

- ✅ Verification completes successfully
- ✅ Trade is verified (verified count = 1)
- ✅ No errors reported

---

### Step 4: Verify Trade Status Updates Correctly

**Action**: Check if trade status was updated based on current price

```sql
SELECT 
  id,
  symbol,
  status,
  entry_price,
  tp1_price,
  stop_loss_price,
  updated_at
FROM trade_signals
WHERE id = 'YOUR_TRADE_ID';
```

**Expected Result**:
- ✅ Status is one of:
  - `'active'` - No targets hit yet
  - `'completed_success'` - TP hit
  - `'completed_failure'` - Stop loss hit
  - `'expired'` - Trade expired
- ✅ `updated_at` timestamp is recent (if status changed)

**Check Trade Results**:
```sql
SELECT 
  trade_signal_id,
  tp1_hit, tp1_hit_at, tp1_hit_price,
  tp2_hit, tp2_hit_at, tp2_hit_price,
  tp3_hit, tp3_hit_at, tp3_hit_price,
  stop_loss_hit, stop_loss_hit_at, stop_loss_hit_price,
  last_verified_at,
  verification_data_source
FROM trade_results
WHERE trade_signal_id = 'YOUR_TRADE_ID';
```

**Expected Result**:
- ✅ If any target was hit:
  - Corresponding `*_hit` field is `true`
  - `*_hit_at` timestamp is populated
  - `*_hit_price` is populated
  - `last_verified_at` is recent
  - `verification_data_source` shows API source (e.g., 'CoinMarketCap')

---

### Step 5: Verify P/L Calculations are Accurate

**Action**: Check profit/loss calculations in the database

```sql
SELECT 
  ts.id,
  ts.symbol,
  ts.entry_price,
  tr.actual_entry_price,
  tr.tp1_hit_price,
  tr.tp2_hit_price,
  tr.tp3_hit_price,
  tr.stop_loss_hit_price,
  tr.gross_profit_loss,
  tr.net_profit_loss,
  tr.profit_loss_percentage,
  tr.trade_size_usd,
  tr.fees_paid,
  tr.slippage_cost
FROM trade_signals ts
LEFT JOIN trade_results tr ON ts.id = tr.trade_signal_id
WHERE ts.id = 'YOUR_TRADE_ID';
```

**Manual Calculation**:
```
Entry Price: $X
Exit Price: $Y (highest TP hit or stop loss)

P/L Percentage = ((Exit Price - Entry Price) / Entry Price) * 100
Gross P/L USD = Trade Size * (P/L Percentage / 100)
Net P/L USD = Gross P/L - Fees - Slippage
```

**Expected Result**:
- ✅ `profit_loss_percentage` matches manual calculation (within 0.01%)
- ✅ `gross_profit_loss` is calculated correctly
- ✅ `net_profit_loss` accounts for fees and slippage
- ✅ All values are reasonable and accurate

---

### Step 6: Trigger GPT-5.1 Analysis

**Action**: Request AI analysis for the completed trade

**Option A: Using Browser (if logged in)**
```
http://localhost:3000/api/atge/analyze-trade?tradeId=YOUR_TRADE_ID
```

**Option B: Using curl (with auth token)**
```bash
curl http://localhost:3000/api/atge/analyze-trade?tradeId=YOUR_TRADE_ID \
  -H "Cookie: auth_token=YOUR_AUTH_TOKEN"
```

**Expected Result**:
```json
{
  "success": true,
  "context": {
    "tradeSignal": { ... },
    "outcome": { ... },
    "technicalIndicators": { ... },
    "marketSnapshot": { ... },
    "metadata": {
      "readyForAnalysis": true,
      "tradeCompleted": true,
      "hasOutcome": true
    }
  },
  "message": "Trade data ready for analysis"
}
```

- ✅ Trade context is retrieved successfully
- ✅ `readyForAnalysis` is `true` (if trade completed or expired)
- ✅ All relevant data is included (outcome, indicators, snapshot)

**Note**: Actual GPT-5.1 analysis generation is not yet implemented in this endpoint. This step verifies the context preparation is working correctly.

---

### Step 7: Verify Analysis is Stored in Database

**Action**: Check if AI analysis was stored (when implemented)

```sql
SELECT 
  trade_signal_id,
  ai_analysis,
  ai_analysis_generated_at,
  ai_analysis_confidence
FROM trade_results
WHERE trade_signal_id = 'YOUR_TRADE_ID';
```

**Expected Result** (when analysis is implemented):
- ✅ `ai_analysis` field contains analysis text
- ✅ `ai_analysis_generated_at` timestamp is populated
- ✅ `ai_analysis_confidence` score is present (0-100)

**Current Status**: Analysis generation is not yet implemented, so these fields will be NULL.

---

### Step 8: Verify Analysis Displays in Trade Details Modal

**Action**: View the trade details in the UI

1. Navigate to ATGE dashboard
2. Find the trade in the trade history
3. Click "View Details" or the trade row
4. Trade Details modal should open

**Expected Result**:
- ✅ Modal displays complete trade information:
  - Trade signal details (entry, TPs, SL)
  - Technical indicators at generation time
  - Market snapshot at generation time
  - Actual outcome (if trade completed)
  - P/L calculations (if trade completed)
  - AI analysis (when implemented)
- ✅ All data is formatted correctly
- ✅ Bitcoin Sovereign styling is applied (black, orange, white)

---

## Success Criteria

The trade lifecycle test is successful when:

- [x] **Step 1**: Trade signal generated with GPT-5.1
- [x] **Step 2**: Trade stored in `trade_signals` table
- [x] **Step 3**: Verification endpoint works correctly
- [x] **Step 4**: Trade status updates based on price movements
- [x] **Step 5**: P/L calculations are accurate
- [x] **Step 6**: Trade analysis context is prepared correctly
- [ ] **Step 7**: AI analysis is stored (pending implementation)
- [ ] **Step 8**: Analysis displays in Trade Details modal (pending implementation)

## Troubleshooting

### Issue: Trade generation fails
- Check OpenAI API key is configured
- Check Gemini API key is configured
- Check rate limits (60 seconds between generations)
- Check daily limit (20 trades per day)

### Issue: Verification fails
- Check CoinMarketCap API key is configured
- Check CoinGecko API key is configured
- Check database connection
- Check trade is in 'active' status

### Issue: P/L calculations are incorrect
- Verify entry price is correct
- Verify exit price (TP or SL hit price) is correct
- Check for rounding errors (should be < 0.01%)
- Verify fees and slippage are reasonable

### Issue: Analysis context fails
- Check trade exists in database
- Check trade has outcome data (completed or expired)
- Check technical indicators were stored
- Check market snapshot was stored

## Notes

- **Trade Expiration**: Trades expire based on timeframe (1h trade expires in 1 hour)
- **Verification Frequency**: Hourly cron job (when implemented) will verify all active trades
- **Data Accuracy**: 100% requirement - no fallback data is used
- **Cost**: Each trade generation costs ~$0.01-0.05 depending on reasoning effort

## Next Steps

After completing this test:

1. Implement GPT-5.1 analysis generation (Step 7)
2. Implement Trade Details modal with analysis display (Step 8)
3. Implement hourly cron job for automatic verification
4. Implement user-triggered refresh button
5. Implement performance analytics dashboard
