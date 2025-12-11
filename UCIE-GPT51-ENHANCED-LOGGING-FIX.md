# UCIE GPT-5.1 Enhanced Logging Fix

**Date**: December 10, 2025  
**Issue**: Jobs stuck in "processing" with no results  
**Fix**: Enhanced logging to diagnose GPT-5.1 API call failures  
**Status**: 🔧 **DEPLOYED - AWAITING VERIFICATION**

---

## 🔍 Problem Summary

### Database Evidence
- 4 out of 5 recent jobs stuck in "processing" status
- `context_data` stored correctly ✅
- `result` field never populated ❌
- Jobs never reach "completed" status ❌
- No error messages logged ❌

### Root Cause
**GPT-5.1 API calls are failing silently** - errors not being caught or logged properly.

---

## 🔧 Fix Applied

### Enhanced Logging Added

#### 1. Function Entry Logging
```typescript
console.log(`🔄 [analyzeDataSource] ========================================`);
console.log(`🔄 [analyzeDataSource] Starting analysis for: ${dataType}`);
console.log(`🔄 [analyzeDataSource] Symbol: ${symbol}`);
console.log(`🔄 [analyzeDataSource] Attempt: ${attempt}/${maxRetries}`);
console.log(`🔄 [analyzeDataSource] Model: ${model}`);
console.log(`🔄 [analyzeDataSource] API Key present: ${!!apiKey}`);
console.log(`🔄 [analyzeDataSource] API Key length: ${apiKey?.length || 0}`);
```

#### 2. SDK Initialization Logging
```typescript
console.log(`🔧 [analyzeDataSource] Importing OpenAI SDK...`);
const OpenAI = (await import('openai')).default;
console.log(`✅ [analyzeDataSource] OpenAI SDK imported successfully`);

console.log(`🔧 [analyzeDataSource] Initializing OpenAI client...`);
const openai = new OpenAI({...});
console.log(`✅ [analyzeDataSource] OpenAI client initialized`);
```

#### 3. API Call Logging
```typescript
console.log(`🚀 [analyzeDataSource] Calling OpenAI API...`);
console.log(`🚀 [analyzeDataSource] Prompt length: ${prompt.length} characters`);

const completion = await openai.chat.completions.create({...});

console.log(`✅ [analyzeDataSource] OpenAI API call completed in ${analysisTime}ms`);
console.log(`📊 [analyzeDataSource] Response received:`, JSON.stringify(completion, null, 2).substring(0, 500) + '...');
```

#### 4. Response Processing Logging
```typescript
console.log(`🔧 [analyzeDataSource] Extracting response text...`);
const analysisText = extractResponseText(completion, true);
console.log(`✅ [analyzeDataSource] Response text extracted: ${analysisText.length} characters`);

console.log(`🔧 [analyzeDataSource] Validating response text...`);
validateResponseText(analysisText, model, completion);
console.log(`✅ [analyzeDataSource] Response text validated`);

console.log(`🔧 [analyzeDataSource] Parsing JSON...`);
const parsed = JSON.parse(analysisText);
console.log(`✅ [analyzeDataSource] JSON parsed successfully`);
```

#### 5. Comprehensive Error Logging
```typescript
catch (error) {
  console.error(`❌ [analyzeDataSource] ========================================`);
  console.error(`❌ [analyzeDataSource] FAILED for ${dataType}`);
  console.error(`❌ [analyzeDataSource] Attempt: ${attempt}/${maxRetries}`);
  console.error(`❌ [analyzeDataSource] Error:`, error);
  console.error(`❌ [analyzeDataSource] Error message:`, error instanceof Error ? error.message : 'Unknown error');
  console.error(`❌ [analyzeDataSource] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
  
  if (error instanceof Error && error.message) {
    console.error(`❌ [analyzeDataSource] Error details:`, JSON.stringify({
      name: error.name,
      message: error.message,
      cause: (error as any).cause
    }, null, 2));
  }
  console.error(`❌ [analyzeDataSource] ========================================`);
}
```

---

## 🎯 What This Will Reveal

### If OpenAI SDK Import Fails
```
🔧 [analyzeDataSource] Importing OpenAI SDK...
❌ [analyzeDataSource] FAILED for Market Data
❌ [analyzeDataSource] Error: Cannot find module 'openai'
```

### If API Key is Missing
```
🔄 [analyzeDataSource] API Key present: false
🔄 [analyzeDataSource] API Key length: 0
❌ [analyzeDataSource] Error: API key is required
```

### If GPT-5.1 Model Not Available
```
🚀 [analyzeDataSource] Calling OpenAI API...
❌ [analyzeDataSource] Error: The model `gpt-5.1` does not exist
```

### If Reasoning Parameter Not Supported
```
🚀 [analyzeDataSource] Calling OpenAI API...
❌ [analyzeDataSource] Error: Invalid parameter: reasoning
```

### If API Call Times Out
```
🚀 [analyzeDataSource] Calling OpenAI API...
❌ [analyzeDataSource] Error: Request timed out
```

### If Response Parsing Fails
```
✅ [analyzeDataSource] OpenAI API call completed in 2500ms
🔧 [analyzeDataSource] Extracting response text...
❌ [analyzeDataSource] Error: Cannot extract response text
```

---

## 📊 Expected Log Flow (Success)

```
🔄 [analyzeDataSource] ========================================
🔄 [analyzeDataSource] Starting analysis for: Market Data
🔄 [analyzeDataSource] Symbol: BTC
🔄 [analyzeDataSource] Attempt: 1/3
🔄 [analyzeDataSource] Model: gpt-5.1
🔄 [analyzeDataSource] API Key present: true
🔄 [analyzeDataSource] API Key length: 51
🔄 [analyzeDataSource] ========================================
🔧 [analyzeDataSource] Importing OpenAI SDK...
✅ [analyzeDataSource] OpenAI SDK imported successfully
🔧 [analyzeDataSource] Initializing OpenAI client...
✅ [analyzeDataSource] OpenAI client initialized
🚀 [analyzeDataSource] Calling OpenAI API...
🚀 [analyzeDataSource] Prompt length: 1234 characters
✅ [analyzeDataSource] OpenAI API call completed in 2500ms
📊 [analyzeDataSource] Response received: {...}
🔧 [analyzeDataSource] Extracting response text...
✅ [analyzeDataSource] Response text extracted: 456 characters
🔧 [analyzeDataSource] Validating response text...
✅ [analyzeDataSource] Response text validated
🔧 [analyzeDataSource] Parsing JSON...
✅ [analyzeDataSource] JSON parsed successfully
✅ [analyzeDataSource] Completed analysis for: Market Data
✅ [analyzeDataSource] ========================================
```

---

## 🔍 How to Check Logs

### Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select project → Deployments → Latest
3. Click "Functions" tab
4. Find `/api/ucie/openai-summary-start/[symbol]`
5. Click "View Logs"
6. Look for the enhanced logging output

### What to Look For
- **🔄 Starting analysis** - Function entry
- **🔧 Importing/Initializing** - SDK setup
- **🚀 Calling OpenAI API** - API call start
- **✅ API call completed** - API call success
- **❌ FAILED** - Error occurred (this is what we need to see!)

---

## 🚀 Deployment

### Files Changed
- `pages/api/ucie/openai-summary-start/[symbol].ts` - Enhanced logging added

### Commit Message
```
fix(ucie): Add comprehensive logging to diagnose GPT-5.1 stuck jobs

- Add detailed logging at every step of analyzeDataSource function
- Log SDK initialization, API calls, response processing
- Add comprehensive error logging with stack traces
- Log API key presence and length (not actual key)
- Log prompt length and response details
- Add clear visual separators for log sections

This will help identify exactly where GPT-5.1 analysis is failing
and why jobs are stuck in "processing" status with no results.

Issue: Jobs have context_data but no result field populated
Expected: Logs will reveal exact failure point in API call chain
```

---

## 🎯 Next Steps

### Immediate (After Deployment)
1. ✅ Deploy enhanced logging version
2. ✅ Trigger new UCIE analysis for BTC
3. ✅ Check Vercel function logs
4. ✅ Identify exact failure point
5. ✅ Implement targeted fix

### Based on Logs
- **If SDK import fails**: Fix module resolution
- **If API key missing**: Check environment variables
- **If model not available**: Fallback to GPT-4o
- **If reasoning not supported**: Remove reasoning parameter
- **If timeout**: Increase timeout or reduce prompt size
- **If parsing fails**: Fix extractResponseText utility

---

## 📝 Testing Instructions

### 1. Deploy Changes
```bash
git add pages/api/ucie/openai-summary-start/[symbol].ts
git commit -m "fix(ucie): Add comprehensive logging to diagnose GPT-5.1 stuck jobs"
git push origin main
```

### 2. Wait for Vercel Deployment
- Monitor Vercel dashboard for deployment completion
- Verify build succeeds

### 3. Trigger New Analysis
```bash
# Start new analysis
curl -X POST https://news.arcane.group/api/ucie/openai-summary-start/BTC \
  -H "Content-Type: application/json" \
  -d '{
    "collectedData": {...},
    "context": {...}
  }'

# Note the jobId returned
```

### 4. Check Vercel Logs
- Go to Vercel dashboard
- Find the function execution
- Look for enhanced logging output
- Identify where it fails

### 5. Report Findings
Document exactly where the failure occurs:
- SDK import?
- Client initialization?
- API call?
- Response extraction?
- JSON parsing?

---

## 🔧 Potential Fixes (Based on Findings)

### Fix 1: If GPT-5.1 Not Available
```typescript
// Fallback to GPT-4o
const model = 'gpt-4o'; // Instead of 'gpt-5.1'

// Remove reasoning parameter
const completion = await openai.chat.completions.create({
  model: model,
  messages: [...],
  // reasoning: { effort: 'low' }, // Remove this
  temperature: 0.7,
  max_tokens: 800
});
```

### Fix 2: If Reasoning Parameter Not Supported
```typescript
// Make reasoning optional
const completionParams: any = {
  model: model,
  messages: [...],
  temperature: 0.7,
  max_tokens: 800
};

// Only add reasoning if model supports it
if (model === 'gpt-5.1') {
  completionParams.reasoning = { effort: 'low' };
}

const completion = await openai.chat.completions.create(completionParams);
```

### Fix 3: If Responses API Not Working
```typescript
// Remove Responses API header
const openai = new OpenAI({
  apiKey: apiKey,
  // defaultHeaders: {
  //   'OpenAI-Beta': 'responses=v1'
  // }
});
```

### Fix 4: If Timeout Issues
```typescript
// Add timeout to API call
const completion = await Promise.race([
  openai.chat.completions.create({...}),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('API call timeout')), 30000)
  )
]);
```

---

## ✅ Success Criteria

### Logs Should Show
- ✅ SDK imported successfully
- ✅ Client initialized
- ✅ API call started
- ✅ API call completed
- ✅ Response extracted
- ✅ Response validated
- ✅ JSON parsed
- ✅ Analysis completed

### Database Should Show
- ✅ Job status = "completed"
- ✅ `result` field populated
- ✅ `completed_at` timestamp set
- ✅ No error message

---

**Status**: 🟡 **DEPLOYED - AWAITING LOG ANALYSIS**  
**Priority**: **CRITICAL**  
**Next Action**: Check Vercel logs after next analysis run

**The enhanced logging will reveal exactly where GPT-5.1 analysis is failing. Once we see the logs, we can implement a targeted fix.**
