# UCIE Testing Guide

## Overview

This guide provides comprehensive testing procedures for the new UCIE (Universal Crypto Intelligence Engine) implementation based on proven working feature patterns.

## Pre-Testing Checklist

### 1. Verify Vercel Deployment
```bash
# Check deployment status
# Visit: https://vercel.com/dashboard
# Look for: Latest deployment with "ucie-market-data.ts"
# Status should be: "Ready"
```

### 2. Verify Build Success
```bash
# Local build test
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ /api/ucie-market-data (0 B, 90.1 kB)
```

### 3. Environment Variables
Ensure these are set in Vercel:
- `COINGECKO_API_KEY` (optional, for rate limit increases)
- `COINMARKETCAP_API_KEY` (optional, for additional data)

## Test Suite

### Test 1: Basic Endpoint Availability

**Objective:** Verify the endpoint is accessible and returns valid responses

```bash
# Test BTC (most common)
curl -i https://news.arcane.group/api/ucie-market-data?symbol=BTC

# Expected:
# HTTP/1.1 200 OK
# Content-Type: application/json
# Response time: < 5 seconds
```

**Success Criteria:**
- ✅ Status code: 200
- ✅ Content-Type: application/json
- ✅ Response time: < 5 seconds
- ✅ Valid JSON structure

### Test 2: XRP Support (Previously Failing)

**Objective:** Verify XRP token validation works with new implementation

```bash
# Test XRP
curl https://news.arcane.group/api/ucie-market-data?symbol=XRP | jq '.'

# Expected response structure:
{
  "success": true,
  "symbol": "XRP",
  "price": <number>,
  "priceAggregation": {
    "average": <number>,
    "confidence": "HIGH|MEDIUM|LOW"
  },
  "dataQuality": {
    "successfulSources": 3-4
  }
}
```

**Success Criteria:**
- ✅ No "unsupported symbol" error
- ✅ Price data from multiple sources
- ✅ At least 2 successful sources
- ✅ Confidence level calculated

### Test 3: Multi-Source Data Aggregation

**Objective:** Verify data is fetched from multiple exchanges

```bash
# Test with verbose output
curl https://news.arcane.group/api/ucie-market-data?symbol=BTC | jq '.sources'

# Expected:
{
  "binance": { "success": true, "price": <number> },
  "kraken": { "success": true, "price": <number> },
  "coinbase": { "success": true, "price": <number> },
  "coingecko": { "success": true, "price": <number> }
}
```

**Success Criteria:**
- ✅ At least 3 sources successful
- ✅ Price spread < 1%
- ✅ All prices within reasonable range
- ✅ Failed sources properly reported

### Test 4: Caching Mechanism

**Objective:** Verify 30-second cache works correctly

```bash
# First request (cache miss)
time curl https://news.arcane.group/api/ucie-market-data?symbol=BTC | jq '.cached'
# Expected: false
# Time: 3-5 seconds

# Second request within 30 seconds (cache hit)
time curl https://news.arcane.group/api/ucie-market-data?symbol=BTC | jq '.cached'
# Expected: true
# Time: < 1 second

# Wait 31 seconds, then request again (cache expired)
sleep 31
time curl https://news.arcane.group/api/ucie-market-data?symbol=BTC | jq '.cached'
# Expected: false
# Time: 3-5 seconds
```

**Success Criteria:**
- ✅ First request: cached = false
- ✅ Second request: cached = true
- ✅ Cache hit response time: < 1 second
- ✅ Cache expires after 30 seconds

### Test 5: Error Handling

**Objective:** Verify graceful error handling

```bash
# Test invalid symbol
curl https://news.arcane.group/api/ucie-market-data?symbol=INVALID | jq '.'

# Expected:
{
  "success": false,
  "error": "Unsupported symbol: INVALID. Supported: BTC, ETH, XRP, ..."
}

# Test missing symbol
curl https://news.arcane.group/api/ucie-market-data | jq '.'

# Expected:
{
  "success": false,
  "error": "Missing or invalid symbol parameter"
}

# Test wrong method
curl -X POST https://news.arcane.group/api/ucie-market-data?symbol=BTC | jq '.'

# Expected:
{
  "success": false,
  "error": "Method not allowed"
}
```

**Success Criteria:**
- ✅ Invalid symbol: 400 status, clear error message
- ✅ Missing symbol: 400 status, clear error message
- ✅ Wrong method: 405 status, clear error message
- ✅ All errors return valid JSON

### Test 6: Data Quality Metrics

**Objective:** Verify data quality scoring works

```bash
# Test data quality
curl https://news.arcane.group/api/ucie-market-data?symbol=BTC | jq '.dataQuality'

# Expected:
{
  "totalSources": 4,
  "successfulSources": 3-4,
  "failedSources": [],
  "confidence": "HIGH",
  "spread": 0.05-0.5
}
```

**Success Criteria:**
- ✅ Total sources: 4
- ✅ Successful sources: 3-4
- ✅ Confidence: HIGH (if 3+ sources)
- ✅ Spread: < 1%

### Test 7: All Supported Symbols

**Objective:** Verify all 10 supported symbols work

```bash
# Test all symbols
for symbol in BTC ETH XRP SOL ADA DOGE DOT MATIC LINK UNI; do
  echo "Testing $symbol..."
  curl -s https://news.arcane.group/api/ucie-market-data?symbol=$symbol | jq -r '.success, .price'
  echo "---"
done

# Expected: All return true and valid prices
```

**Success Criteria:**
- ✅ All 10 symbols return success: true
- ✅ All prices are positive numbers
- ✅ All responses < 5 seconds
- ✅ No errors or timeouts

### Test 8: Concurrent Requests

**Objective:** Verify endpoint handles concurrent requests

```bash
# Test concurrent requests
for i in {1..5}; do
  curl -s https://news.arcane.group/api/ucie-market-data?symbol=BTC &
done
wait

# Expected: All 5 requests succeed
```

**Success Criteria:**
- ✅ All requests return 200
- ✅ No timeout errors
- ✅ Consistent response times
- ✅ Cache works correctly

### Test 9: Response Time Under Load

**Objective:** Verify performance under load

```bash
# Test response time
for i in {1..10}; do
  time curl -s https://news.arcane.group/api/ucie-market-data?symbol=BTC > /dev/null
done

# Expected average: 3-5 seconds (first request), < 1 second (cached)
```

**Success Criteria:**
- ✅ First request: < 5 seconds
- ✅ Cached requests: < 1 second
- ✅ No timeouts
- ✅ Consistent performance

### Test 10: Sparkline Data

**Objective:** Verify 7-day price history is included

```bash
# Test sparkline
curl https://news.arcane.group/api/ucie-market-data?symbol=BTC | jq '.sparkline | length'

# Expected: 168 (7 days * 24 hours)
```

**Success Criteria:**
- ✅ Sparkline array exists
- ✅ Length: ~168 data points
- ✅ All values are numbers
- ✅ Values in reasonable range

## Automated Test Script

```bash
#!/bin/bash

# UCIE Market Data Endpoint Test Suite

BASE_URL="https://news.arcane.group/api/ucie-market-data"
PASS=0
FAIL=0

echo "🚀 UCIE Market Data Endpoint Test Suite"
echo "========================================"
echo ""

# Test 1: BTC Basic
echo "Test 1: BTC Basic Endpoint..."
RESPONSE=$(curl -s "$BASE_URL?symbol=BTC")
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ PASS: BTC endpoint returns success"
  ((PASS++))
else
  echo "❌ FAIL: BTC endpoint failed"
  ((FAIL++))
fi
echo ""

# Test 2: XRP Support
echo "Test 2: XRP Support..."
RESPONSE=$(curl -s "$BASE_URL?symbol=XRP")
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ PASS: XRP is supported"
  ((PASS++))
else
  echo "❌ FAIL: XRP not supported"
  ((FAIL++))
fi
echo ""

# Test 3: Invalid Symbol
echo "Test 3: Invalid Symbol Handling..."
RESPONSE=$(curl -s "$BASE_URL?symbol=INVALID")
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo "✅ PASS: Invalid symbol properly rejected"
  ((PASS++))
else
  echo "❌ FAIL: Invalid symbol not handled"
  ((FAIL++))
fi
echo ""

# Test 4: Missing Symbol
echo "Test 4: Missing Symbol Handling..."
RESPONSE=$(curl -s "$BASE_URL")
if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo "✅ PASS: Missing symbol properly rejected"
  ((PASS++))
else
  echo "❌ FAIL: Missing symbol not handled"
  ((FAIL++))
fi
echo ""

# Test 5: Data Quality
echo "Test 5: Data Quality Metrics..."
RESPONSE=$(curl -s "$BASE_URL?symbol=BTC")
SOURCES=$(echo "$RESPONSE" | jq -r '.dataQuality.successfulSources')
if [ "$SOURCES" -ge 2 ]; then
  echo "✅ PASS: At least 2 sources successful ($SOURCES/4)"
  ((PASS++))
else
  echo "❌ FAIL: Insufficient sources ($SOURCES/4)"
  ((FAIL++))
fi
echo ""

# Test 6: Caching
echo "Test 6: Caching Mechanism..."
RESPONSE1=$(curl -s "$BASE_URL?symbol=BTC" | jq -r '.cached')
RESPONSE2=$(curl -s "$BASE_URL?symbol=BTC" | jq -r '.cached')
if [ "$RESPONSE1" == "false" ] && [ "$RESPONSE2" == "true" ]; then
  echo "✅ PASS: Caching works correctly"
  ((PASS++))
else
  echo "❌ FAIL: Caching not working (R1: $RESPONSE1, R2: $RESPONSE2)"
  ((FAIL++))
fi
echo ""

# Summary
echo "========================================"
echo "Test Results: $PASS passed, $FAIL failed"
echo "Success Rate: $(( PASS * 100 / (PASS + FAIL) ))%"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed"
  exit 1
fi
```

## Manual Testing Checklist

### Pre-Deployment
- [ ] Code review complete
- [ ] Build succeeds locally
- [ ] No TypeScript errors
- [ ] No linting errors

### Post-Deployment
- [ ] Endpoint accessible (200 status)
- [ ] BTC data fetches correctly
- [ ] XRP data fetches correctly (previously failing)
- [ ] All 10 symbols work
- [ ] Caching works (30-second TTL)
- [ ] Error handling works
- [ ] Data quality metrics accurate
- [ ] Response times acceptable (< 5s)
- [ ] Concurrent requests handled
- [ ] Sparkline data included

### Integration Testing
- [ ] Can be called from frontend
- [ ] CORS headers correct
- [ ] Response format matches expectations
- [ ] Error messages are user-friendly

## Troubleshooting

### Issue: 404 Not Found
**Cause:** Vercel hasn't deployed yet or route not recognized
**Solution:** Wait 2-3 minutes, check Vercel dashboard

### Issue: 500 Internal Server Error
**Cause:** API client error or timeout
**Solution:** Check Vercel function logs for details

### Issue: Timeout
**Cause:** API sources slow or unavailable
**Solution:** Check individual source status, verify timeout settings

### Issue: Invalid Price Data
**Cause:** API response format changed
**Solution:** Check API documentation, update parsing logic

### Issue: Cache Not Working
**Cause:** In-memory cache cleared (serverless restart)
**Solution:** Expected behavior, cache will rebuild

## Next Steps After Testing

### If All Tests Pass ✅
1. Create `ucie-technical.ts` endpoint
2. Create `ucie-research.ts` endpoint
3. Create `ucie-analyze.ts` orchestration
4. Build UCIE component

### If Tests Fail ❌
1. Review Vercel function logs
2. Check API source status
3. Verify environment variables
4. Debug specific failing tests
5. Fix issues and redeploy

## Success Criteria

**Minimum Requirements:**
- ✅ 200 status code
- ✅ Valid JSON response
- ✅ At least 2 successful sources
- ✅ Price data within reasonable range
- ✅ Response time < 5 seconds

**Optimal Requirements:**
- ✅ All 4 sources successful
- ✅ Confidence: HIGH
- ✅ Spread < 0.5%
- ✅ Response time < 3 seconds
- ✅ Cache hit time < 1 second

---

**Status:** Ready for Testing
**Last Updated:** January 27, 2025
**Next Action:** Run test suite after Vercel deployment completes
