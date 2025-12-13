# UCIE Frontend Test Plan

**Created**: December 13, 2025  
**Status**: 🧪 Ready for Execution  
**Priority**: HIGH  
**Focus**: Data Collection, Formatting, and Display

---

## 🎯 Test Objectives

1. Verify data collection from all 5 sources
2. Validate data formatting and quality scoring
3. Test frontend display in DataPreviewModal
4. Check cache behavior (30-min TTL, 20-min freshness)
5. Verify error handling and graceful degradation
6. Measure performance metrics

---

## 🔧 Test Environment Setup

### Prerequisites
- Local dev server running (`npm run dev`)
- All environment variables configured
- Supabase database accessible
- API keys valid

### Test Symbols
- **Primary**: BTC (most reliable)
- **Secondary**: ETH (good coverage)
- **Edge Case**: SOL (newer, limited data)

---

## 📋 Test Cases

### TEST 1: Data Collection - Happy Path (BTC)

**Steps**:
1. Start dev server: `npm run dev`
2. Navigate to UCIE feature
3. Enter symbol: `BTC`
4. Click "Get Preview"
5. Wait for completion (60-120s)

**Expected Results**:
- ✅ Modal opens with progress indicators
- ✅ All 5 sources show quality scores
- ✅ Overall quality ≥ 70%
- ✅ Timestamps within 20 minutes
- ✅ "Continue" button enabled

**Record**:
- Market quality: ___%
- Sentiment quality: ___%
- Technical quality: ___%
- News quality: ___%
- On-chain quality: ___%
- Overall quality: ___%
- Total time: ___s

---

### TEST 2: Cache Behavior

**Steps**:
1. Complete TEST 1
2. Wait 5 minutes
3. Request BTC again
4. Verify cached data used
5. Wait 30 minutes total
6. Request BTC again
7. Verify fresh data collected

**Expected**:
- ✅ Cache hit at 5 min (< 1s response)
- ✅ Cache miss at 30 min (new collection)

---

### TEST 3: Refresh Parameter

**Steps**:
1. Complete TEST 1
2. Request `BTC?refresh=true`
3. Verify cache bypassed

**Expected**:
- ✅ Fresh data collected
- ✅ New timestamps
- ✅ 60-120s collection time

---

### TEST 4-8: Data Formatting

Test each data source section:
- TEST 4: Market Data
- TEST 5: Sentiment Data
- TEST 6: Technical Indicators
- TEST 7: News Articles
- TEST 8: On-Chain Data

**Verify**:
- All expected fields present
- Correct data types
- Proper formatting
- Valid ranges
- Recent timestamps

---

### TEST 9: Individual Source Failure

**Steps**:
1. Disable one API key
2. Request BTC data
3. Observe graceful degradation

**Expected**:
- ✅ Other sources continue
- ✅ Failed source shows error
- ✅ Overall quality reduced
- ✅ Continue enabled if quality ≥ 60%

---

### TEST 10: Multiple Source Failures

**Steps**:
1. Disable 2-3 API keys
2. Request BTC data
3. Observe behavior

**Expected**:
- ✅ Working sources continue
- ✅ Quality significantly reduced
- ✅ Continue disabled if quality < 60%

---

### TEST 11: Network Timeout

**Steps**:
1. Simulate slow network (Slow 3G)
2. Request BTC data
3. Observe timeout handling

**Expected**:
- ✅ 60s timeout per API
- ✅ 2 retry attempts
- ✅ Timeout error after retries
- ✅ Other sources continue

---

### TEST 12-13: Frontend Display

- TEST 12: DataPreviewModal UI
- TEST 13: Data Source Expander

**Verify**:
- Modal layout correct
- All UI elements present
- Responsive design works
- Expand/collapse smooth
- Loading indicators animate

---

### TEST 14: API Response Times

**Measure**:
- CoinGecko: ___ms (expect 82-85ms)
- Kraken: ___ms (expect 82-89ms)
- NewsAPI: ___ms (expect 201-239ms)
- CoinMarketCap: ___ms (expect 320-670ms)
- LunarCrush: ___ms (expect 469-726ms)
- Reddit: ___ms (expect 635-670ms)
- Total: ___s (expect 60-120s)

---

### TEST 15: Data Quality Percentages

**Record**:
- Market: ___% (expect 80-100%)
- Sentiment: ___% (expect 70-100%)
- Technical: ___% (expect 90-100%)
- News: ___% (expect 70-100%)
- On-Chain: ___% (expect 60-100%)
- Overall: ___% (expect 70-100%)

---

## 📊 Test Results Summary

**Total Tests**: 15  
**Passed**: ___  
**Failed**: ___  
**Pass Rate**: ___%

**Critical Issues**:
1. ___
2. ___
3. ___

**Recommendations**:
1. ___
2. ___
3. ___

---

## 🚀 Next Steps

1. Document bugs in GitHub Issues
2. Create fix priority list
3. Update UCIE documentation
4. Plan GPT-5.1 testing (separate plan)
5. Schedule regression testing

---

**Status**: 📋 Ready for Execution  
**Estimated Time**: 2-3 hours  
**Prerequisites**: Local dev server, API keys configured
