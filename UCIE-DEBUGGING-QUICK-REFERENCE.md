# UCIE Debugging Quick Reference Guide

**Last Updated**: December 13, 2025  
**Status**: ✅ Based on verified test results  
**Purpose**: Quick troubleshooting guide for UCIE data flow issues

---

## 🚀 Quick Start: Run the Testing Script

```bash
# Test UCIE data flow for BTC
npx tsx scripts/test-ucie-flow-complete.ts BTC

# Force refresh (bypass cache)
npx tsx scripts/test-ucie-flow-complete.ts BTC true

# Test different symbol
npx tsx scripts/test-ucie-flow-complete.ts ETH
```

**Expected Output**: 11/11 tests pass with 100% success rate

---

## 🔍 Debugging by Symptom

### Symptom 1: "No data showing in UCIE preview"

**Possible Causes**:
1. API endpoint not responding
2. Database connection failed
3. Data quality below 70%
4. Cache expired

**Debug Steps**:
```bash
# Step 1: Run the testing script
npx tsx scripts/test-ucie-flow-complete.ts BTC true

# Step 2: Check which step failed
# Look for ❌ FAIL in the output

# Step 3: Check specific endpoint
curl https://news.arcane.group/api/ucie/market-data/BTC?refresh=true

# Step 4: Check database directly
psql $DATABASE_URL -c "SELECT * FROM ucie_analysis_cache WHERE symbol='BTC' LIMIT 5;"
```

**Common Fixes**:
- If API fails: Check API key in `.env.local`
- If database fails: Check DATABASE_URL connection string
- If data quality low: Check API response structure
- If cache expired: Add `?refresh=true` to force refresh

---

### Symptom 2: "Data is stale (old)"

**Possible Causes**:
1. Cache TTL not being enforced
2. Data not being refreshed
3. Endpoint returning old data

**Debug Steps**:
```bash
# Check cache age in database
psql $DATABASE_URL -c "
  SELECT 
    symbol, 
    analysis_type, 
    created_at, 
    expires_at,
    NOW() - created_at as age,
    expires_at - NOW() as ttl_remaining
  FROM ucie_analysis_cache 
  WHERE symbol='BTC'
  ORDER BY created_at DESC;
"

# Force refresh
curl https://news.arcane.group/api/ucie/market-data/BTC?refresh=true
```

**Common Fixes**:
- If TTL expired: Data will auto-refresh on next request
- If data not refreshing: Check API endpoint is working
- If endpoint slow: May need optimization

---

### Symptom 3: "Data quality is low (< 70%)"

**Possible Causes**:
1. API returning incomplete data
2. Data validation failing
3. Multiple API sources failing

**Debug Steps**:
```bash
# Check data quality scores
psql $DATABASE_URL -c "
  SELECT 
    symbol, 
    analysis_type, 
    data_quality_score,
    created_at
  FROM ucie_analysis_cache 
  WHERE symbol='BTC'
  ORDER BY created_at DESC;
"

# Check API response directly
curl https://news.arcane.group/api/ucie/sentiment/BTC | jq '.data.dataQuality'
```

**Common Fixes**:
- If quality < 70%: Check API response structure
- If multiple sources failing: Check API keys in `.env.local`
- If validation failing: Check data format matches expected schema

---

### Symptom 4: "Database connection error"

**Possible Causes**:
1. DATABASE_URL not set
2. DATABASE_URL format incorrect
3. Supabase database down
4. Network connectivity issue

**Debug Steps**:
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection directly
psql $DATABASE_URL -c "SELECT NOW();"

# Check connection string format
# Should be: postgres://user:pass@host:6543/postgres
# NOT: postgres://user:pass@host:6543/postgres?sslmode=require
```

**Common Fixes**:
- If not set: Add to `.env.local`
- If format wrong: Remove `?sslmode=require` from URL
- If Supabase down: Check https://status.supabase.com
- If network issue: Check firewall/VPN settings

---

### Symptom 5: "API timeout (slow response)"

**Possible Causes**:
1. API endpoint slow
2. Network latency
3. API rate limited
4. Database query slow

**Debug Steps**:
```bash
# Check API response time
time curl https://news.arcane.group/api/ucie/news/BTC

# Check which endpoint is slow
npx tsx scripts/test-ucie-flow-complete.ts BTC true | grep "Duration"

# Check database query performance
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT * FROM ucie_analysis_cache 
  WHERE symbol='BTC' AND analysis_type='market-data'
  LIMIT 1;
"
```

**Common Fixes**:
- If API slow: Check API provider status
- If network slow: Check internet connection
- If rate limited: Wait and retry
- If database slow: Check indexes are created

---

## 📊 Expected Performance Metrics

### API Response Times (from verified test)
| Endpoint | Expected Time | Status |
|----------|---------------|--------|
| Market Data | ~840ms | ✅ Normal |
| Sentiment | ~1000ms | ✅ Normal |
| Technical | ~430ms | ✅ Fast |
| News | ~10400ms | ⚠️ Slow but acceptable |
| On-Chain | ~5570ms | ✅ Normal |

**If your times are significantly different**: Check network/API status

### Data Quality Scores (from verified test)
| Source | Expected Quality | Minimum |
|--------|------------------|---------|
| Market Data | 100% | 70% |
| Sentiment | 85% | 70% |
| Technical | 95% | 70% |
| News | 88% | 70% |
| On-Chain | 100% | 70% |

**If quality is below minimum**: Check API response structure

### Cache TTL (from verified test)
| Source | TTL | Status |
|--------|-----|--------|
| Market Data | 300s (5 min) | ✅ Normal |
| Sentiment | 300s (5 min) | ✅ Normal |
| Technical | 300s (5 min) | ✅ Normal |
| News | 300s (5 min) | ✅ Normal |
| On-Chain | 300s (5 min) | ✅ Normal |

**If TTL is different**: Check cache configuration

---

## 🔧 Common Configuration Issues

### Issue 1: DATABASE_URL Format

**Wrong**:
```bash
DATABASE_URL=postgres://user:pass@host:6543/postgres?sslmode=require
```

**Correct**:
```bash
DATABASE_URL=postgres://user:pass@host:6543/postgres
```

**Why**: The code handles SSL configuration separately

---

### Issue 2: API Keys Missing

**Check**:
```bash
# Verify all required keys are set
grep -E "API_KEY|TOKEN" .env.local | head -20
```

**Required Keys**:
- `OPENAI_API_KEY` - For GPT-5.1 analysis
- `COINMARKETCAP_API_KEY` - For market data
- `NEWS_API_KEY` - For news articles
- `LUNARCRUSH_API_KEY` - For sentiment
- `ETHERSCAN_API_KEY` - For on-chain data

---

### Issue 3: Base URL Wrong

**Check**:
```bash
# Verify BASE_URL in test script
grep "BASE_URL" scripts/test-ucie-flow-complete.ts
```

**Should be**:
```
https://news.arcane.group (production)
http://localhost:3000 (development)
```

---

## 📋 Step-by-Step Debugging Workflow

### Step 1: Run the Test Script
```bash
npx tsx scripts/test-ucie-flow-complete.ts BTC true
```

### Step 2: Check Test Results
- ✅ All 11 tests pass? → System is working
- ❌ Some tests fail? → Go to Step 3

### Step 3: Identify Failed Step
Look for ❌ FAIL in output and note the step number

### Step 4: Debug Specific Step

**If Step 1 fails (Database Connection)**:
```bash
psql $DATABASE_URL -c "SELECT NOW();"
```

**If Step 2-3 fail (Market Data)**:
```bash
curl https://news.arcane.group/api/ucie/market-data/BTC?refresh=true | jq
```

**If Step 4-5 fail (Sentiment)**:
```bash
curl https://news.arcane.group/api/ucie/sentiment/BTC?refresh=true | jq
```

**If Step 6-7 fail (Technical)**:
```bash
curl https://news.arcane.group/api/ucie/technical/BTC?refresh=true | jq
```

**If Step 8-9 fail (News)**:
```bash
curl https://news.arcane.group/api/ucie/news/BTC?refresh=true | jq
```

**If Step 10-11 fail (On-Chain)**:
```bash
curl https://news.arcane.group/api/ucie/on-chain/BTC?refresh=true | jq
```

### Step 5: Check API Response
Look for:
- `"success": true` - API is working
- `"error"` field - API returned error
- `"data"` field - Data structure is correct
- `"dataQuality"` - Quality score

### Step 6: Check Database
```bash
psql $DATABASE_URL -c "
  SELECT symbol, analysis_type, data_quality_score, created_at 
  FROM ucie_analysis_cache 
  WHERE symbol='BTC' 
  ORDER BY created_at DESC 
  LIMIT 5;
"
```

### Step 7: Fix Issue
Based on findings, apply appropriate fix from "Common Fixes" section

### Step 8: Re-run Test
```bash
npx tsx scripts/test-ucie-flow-complete.ts BTC true
```

---

## 🆘 Emergency Troubleshooting

### If Everything is Broken

```bash
# 1. Check environment variables
env | grep -E "DATABASE|API|KEY" | head -20

# 2. Check database connection
psql $DATABASE_URL -c "SELECT NOW();"

# 3. Check API endpoints
curl https://news.arcane.group/api/ucie/market-data/BTC

# 4. Check logs
tail -100 ~/.pm2/logs/next-app-error.log

# 5. Restart services
pm2 restart all
```

### If Database is Down

```bash
# Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# Try reconnecting
psql $DATABASE_URL -c "SELECT NOW();"

# If still down, wait for Supabase to recover
```

### If API is Rate Limited

```bash
# Wait 60 seconds and retry
sleep 60
npx tsx scripts/test-ucie-flow-complete.ts BTC true

# Or use force refresh to bypass cache
curl https://news.arcane.group/api/ucie/market-data/BTC?refresh=true
```

---

## 📞 Getting Help

### Information to Provide

When reporting issues, include:

1. **Test Output**:
   ```bash
   npx tsx scripts/test-ucie-flow-complete.ts BTC true > test-output.txt 2>&1
   ```

2. **Environment Check**:
   ```bash
   echo "DATABASE_URL: $DATABASE_URL"
   echo "NODE_ENV: $NODE_ENV"
   node --version
   npm --version
   ```

3. **API Response**:
   ```bash
   curl https://news.arcane.group/api/ucie/market-data/BTC | jq > api-response.json
   ```

4. **Database State**:
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM ucie_analysis_cache WHERE symbol='BTC' LIMIT 1;" > db-state.txt
   ```

---

## 🎯 Quick Fixes Checklist

- [ ] Run test script: `npx tsx scripts/test-ucie-flow-complete.ts BTC true`
- [ ] Check DATABASE_URL format (no `?sslmode=require`)
- [ ] Verify all API keys in `.env.local`
- [ ] Check API endpoint is responding: `curl https://news.arcane.group/api/ucie/market-data/BTC`
- [ ] Check database connection: `psql $DATABASE_URL -c "SELECT NOW();"`
- [ ] Force refresh cache: `curl https://news.arcane.group/api/ucie/market-data/BTC?refresh=true`
- [ ] Check data quality: `psql $DATABASE_URL -c "SELECT data_quality_score FROM ucie_analysis_cache WHERE symbol='BTC' LIMIT 1;"`
- [ ] Restart services: `pm2 restart all`
- [ ] Check Supabase status: https://status.supabase.com

---

## 📚 Related Documentation

- **UCIE System Guide**: `.kiro/steering/ucie-system.md`
- **API Status**: `api-status.md`
- **API Integration**: `api-integration.md`
- **Test Results**: `UCIE-TESTING-FLOW-COMPLETE.md`
- **Database Guide**: `UCIE-DATABASE-ACCESS-GUIDE.md`

---

**Last Verified**: December 13, 2025  
**Test Status**: ✅ All 11 tests passing  
**System Status**: ✅ Fully operational

