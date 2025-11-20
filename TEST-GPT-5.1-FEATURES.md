# 🧪 Test GPT-5.1 Features - Quick Guide

**Deployment**: ✅ Pushed to GitHub (auto-deploying to Vercel)  
**Status**: Ready for testing once deployed

---

## ⚠️ BEFORE TESTING

### Add Environment Variables to Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add these **4 new variables**:

```
OPENAI_MODEL = gpt-5.1
OPENAI_FALLBACK_MODEL = gpt-5-mini
REASONING_EFFORT = none
VERBOSITY = medium
```

4. Apply to: **Production**, **Preview**, **Development**
5. Wait for Vercel to redeploy (2-3 minutes)

---

## 🧪 Features to Test

### 1. Live Trade Generation (MIGRATED ✅)

**Endpoint**: `/api/live-trade-generation?symbol=BTC`

**What it does**: Generates AI-powered trade signals using live market data

**Test Command**:
```bash
curl https://news.arcane.group/api/live-trade-generation?symbol=BTC
```

**Expected**:
- ✅ Valid JSON response with trade signal
- ✅ Response time: 5-10 seconds
- ✅ No errors

**Check Vercel Logs For**:
```
[Trade Gen] Using OpenAI model: gpt-5.1
[OpenAI] Calling gpt-5.1 via Responses API...
[OpenAI] Response received from gpt-5.1
```

---

### 2. ATGE Trade Analysis (MIGRATED ✅)

**Feature**: AI Trade Generation Engine - Analyzes completed trades

**Location**: Uses `lib/atge/aiAnalyzer.ts`

**Test**: Generate a trade and let it complete, then check analysis

**Expected**:
- ✅ Detailed trade analysis
- ✅ Uses GPT-5.1 for reasoning
- ✅ Shows what worked/didn't work

**Check Logs For**:
```
[ATGE] Analyzing trade with gpt-5.1...
[ATGE] Trade analysis completed with gpt-5.1
```

---

### 3. UCIE Analysis (MIGRATED ✅)

**Feature**: Universal Crypto Intelligence Engine

**Endpoint**: `/api/ucie/openai-analysis/BTC` or `/api/ucie/openai-summary/BTC`

**What it does**: Comprehensive crypto analysis using multiple data sources

**Test Command**:
```bash
curl https://news.arcane.group/api/ucie/openai-analysis/BTC
```

**Expected**:
- ✅ Comprehensive market analysis
- ✅ Response time: 10-20 seconds
- ✅ High-quality insights

**Check Logs For**:
```
[UCIE] Attempting analysis with gpt-5.1...
[UCIE] Analysis completed successfully with gpt-5.1
```

---

### 4. Bitcoin Market Analysis (NOT YET MIGRATED)

**Endpoint**: `/api/btc-analysis`

**Status**: ⚠️ Still uses old API (will work but not using GPT-5.1 yet)

**Test Command**:
```bash
curl https://news.arcane.group/api/btc-analysis
```

**Expected**:
- ✅ Works (uses gpt-4o via old API)
- ⚠️ Not using GPT-5.1 yet (needs migration)

---

### 5. Crypto News Analysis (NOT YET MIGRATED)

**Endpoint**: `/api/crypto-herald`

**Status**: ⚠️ Still uses old API

**Test Command**:
```bash
curl https://news.arcane.group/api/crypto-herald
```

**Expected**:
- ✅ Works (uses gpt-4o via old API)
- ⚠️ Not using GPT-5.1 yet

---

## 🎯 Priority Testing Order

### Test These First (Migrated to GPT-5.1)

1. **Live Trade Generation** - `/api/live-trade-generation?symbol=BTC`
2. **UCIE Analysis** - `/api/ucie/openai-analysis/BTC`
3. **ATGE Trade Analysis** - Generate a trade and check analysis

### Test These Later (Still on Old API)

4. **Bitcoin Analysis** - `/api/btc-analysis`
5. **Ethereum Analysis** - `/api/eth-analysis`
6. **Crypto Herald** - `/api/crypto-herald`

---

## 📊 What to Look For

### Success Indicators ✅

**In Vercel Logs**:
```
[OpenAI] Calling gpt-5.1 via Responses API...
[OpenAI] Response received from gpt-5.1
```

**In API Response**:
- Valid JSON structure
- High-quality analysis
- Reasonable response time (5-20s depending on reasoning effort)
- No errors

### Error Indicators ❌

**In Vercel Logs**:
```
❌ 404: Model gpt-5.1 not found
❌ Error calling gpt-5.1
❌ Cannot read property 'content' of undefined
```

**In API Response**:
- 500 Internal Server Error
- Empty or malformed response
- Timeout errors

---

## 🔍 How to Check Vercel Logs

### Option 1: Vercel CLI
```bash
vercel logs --follow
```

### Option 2: Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Click latest deployment
5. Click "Logs" tab
6. Filter by "OpenAI" to see relevant logs

---

## 🐛 If Something Goes Wrong

### Quick Fix: Use Fallback Model

If GPT-5.1 doesn't work immediately:

1. In Vercel, change:
   ```
   OPENAI_MODEL = gpt-4o
   ```

2. Redeploy

3. System will work with gpt-4o while you troubleshoot GPT-5.1 access

### Check API Key Access

GPT-5.1 might require:
- ✅ Updated API key with GPT-5 access
- ✅ Sufficient credits/quota
- ✅ Account in good standing

Contact OpenAI support if you don't have access yet.

---

## ✅ Testing Checklist

### Pre-Test
- [ ] Environment variables added to Vercel
- [ ] Vercel deployment completed
- [ ] No build errors

### Test Migrated Features
- [ ] Live Trade Generation works
- [ ] UCIE Analysis works
- [ ] ATGE Trade Analysis works
- [ ] Vercel logs show `gpt-5.1`
- [ ] Response quality is good
- [ ] No errors in logs

### Optional Tests
- [ ] Test with different reasoning efforts (none, low, medium, high)
- [ ] Test with different verbosity levels (low, medium, high)
- [ ] Test fallback mechanism (if primary fails)

---

## 🎯 Recommended Test

**Start with this simple test**:

```bash
# Test the migrated live trade generation endpoint
curl https://news.arcane.group/api/live-trade-generation?symbol=BTC
```

**Then check Vercel logs** for:
```
[OpenAI] Calling gpt-5.1 via Responses API...
[OpenAI] Response received from gpt-5.1
```

If you see those logs, **GPT-5.1 is working!** ✅

---

## 📋 Summary

**What to Test**:
1. **Live Trade Generation** - Main migrated feature
2. **UCIE Analysis** - Comprehensive crypto analysis
3. **ATGE Trade Analysis** - Trade performance analysis

**How to Test**:
- Use curl commands above
- Check Vercel logs for `gpt-5.1` usage
- Verify response quality

**What to Check**:
- ✅ No errors in logs
- ✅ `gpt-5.1` model being used
- ✅ Good response quality
- ✅ Reasonable response times

---

**Status**: ✅ **READY FOR TESTING**  
**Priority**: Test Live Trade Generation first  
**Expected**: Should work with GPT-5.1 once Vercel redeploys

