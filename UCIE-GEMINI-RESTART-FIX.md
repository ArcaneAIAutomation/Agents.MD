# UCIE Gemini Analysis Restart Issue - Complete Fix

**Date**: November 15, 2025  
**Issue**: Analysis restarts when "Generating comprehensive AI analysis" runs  
**Root Cause**: Gemini generation fails/times out, but error is not communicated to frontend

---

## 🔍 Problem Analysis

### What's Happening:
1. ✅ Phase 1 completes successfully (all 5 data sources cached)
2. ✅ Frontend shows "Generating comprehensive AI analysis..."
3. ❌ Gemini generation fails or times out (45-second timeout)
4. ❌ Error is caught and basic fallback summary is used
5. ❌ Basic summary is < 500 chars, so NOT stored in database
6. ❌ Status endpoint never sees completed Gemini analysis
7. ❌ Frontend keeps polling, eventually times out
8. ❌ User is redirected back to start

### Evidence from Logs:
```
✅ Cache hit for BTC/market-data (age: 54s, quality: 100)
✅ Cache hit for BTC/sentiment (age: 54s, quality: 100)
✅ Cache hit for BTC/technical (age: 65s, quality: 95)
✅ Cache hit for BTC/news (age: 11s, quality: 90)
✅ Cache hit for BTC/on-chain (age: 65s, quality: 100)

🤖 Generating Gemini AI summary...
❌ Gemini AI failed: [timeout or error]
📝 Using basic fallback summary (245 chars)
⚠️ Gemini summary too short (245 chars), not storing in database
```

---

## 🎯 Root Causes

### 1. Gemini Timeout (45 seconds)
- Gemini API can take 30-60 seconds for 10000 tokens
- Current timeout: 45 seconds
- Vercel function timeout: 60 seconds
- **Issue**: Not enough time for Gemini to complete

### 2. No Error Communication
- When Gemini fails, error is caught silently
- Basic fallback summary is generated
- Frontend never knows there was an error
- **Issue**: Frontend keeps waiting for Gemini analysis that will never come

### 3. Status Endpoint Limitation
- Status endpoint only checks if Gemini analysis exists in database
- Doesn't check for errors or failures
- **Issue**: Can't distinguish between "still generating" and "failed"

---

## ✅ Complete Fix Strategy

### Fix #1: Increase Gemini Timeout
**File**: `pages/api/ucie/preview-data/[symbol].ts`

**Change**:
```typescript
// OLD: 45-second timeout
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('Gemini timeout after 45 seconds')), 45000);
});

// NEW: Remove timeout, let Vercel's 60s limit handle it
// Gemini will complete or Vercel will timeout
const response = await generateGeminiAnalysis(systemPrompt, context, 10000, 0.7);
```

**Rationale**: Let Gemini use the full 60 seconds if needed

### Fix #2: Store Error State in Database
**File**: `lib/ucie/geminiAnalysisStorage.ts`

**Add new function**:
```typescript
export async function storeGeminiError(
  symbol: string,
  userId: string,
  userEmail: string,
  errorMessage: string,
  dataQualityScore: number
): Promise<void> {
  await query(
    `INSERT INTO ucie_gemini_analysis 
     (symbol, user_id, user_email, summary_text, data_quality_score, analysis_type, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (symbol, user_id) DO UPDATE SET
       summary_text = $4,
       data_quality_score = $5,
       analysis_type = $6,
       updated_at = NOW()`,
    [symbol, userId, userEmail, `ERROR: ${errorMessage}`, dataQualityScore, 'error']
  );
}
```

### Fix #3: Update Error Handling
**File**: `pages/api/ucie/preview-data/[symbol].ts`

**Change**:
```typescript
try {
  summary = await generateGeminiSummary(normalizedSymbol, collectedData, apiStatus);
  console.log(`✅ Gemini AI summary generated (${summary.length} chars)`);
  
  // Store in database (even if short, for status tracking)
  const { storeGeminiAnalysis } = await import('../../../../lib/ucie/geminiAnalysisStorage');
  await storeGeminiAnalysis({
    symbol: normalizedSymbol,
    userId: userId || 'anonymous',
    userEmail: userEmail || 'anonymous@example.com',
    summaryText: summary,
    dataQualityScore: dataQuality,
    apiStatus: apiStatus,
    modelUsed: 'gemini-2.5-pro',
    analysisType: summary.length > 500 ? 'summary' : 'fallback',
    dataSourcesUsed: apiStatus.working,
    availableDataCount: apiStatus.working.length
  });
  
} catch (error) {
  console.error('❌ Failed to generate Gemini AI summary:', error);
  
  // Store error in database so status endpoint knows it failed
  const { storeGeminiError } = await import('../../../../lib/ucie/geminiAnalysisStorage');
  await storeGeminiError(
    normalizedSymbol,
    userId || 'anonymous',
    userEmail || 'anonymous@example.com',
    error instanceof Error ? error.message : String(error),
    dataQuality
  );
  
  // Generate fallback summary
  summary = generateBasicSummary(normalizedSymbol, collectedData, apiStatus);
}
```

### Fix #4: Update Status Endpoint
**File**: `pages/api/ucie/preview-data/[symbol]/status.ts`

**Change**:
```typescript
// Check for Gemini analysis (including errors)
const geminiAnalysis = await getGeminiAnalysis(symbolUpper, userId);
const geminiAvailable = !!geminiAnalysis;
const geminiError = geminiAnalysis?.analysis_type === 'error';

// Determine status
if (completedCount === totalSources && !geminiAvailable) {
  status = 'analyzing';
  message = 'Generating AI analysis...';
} else if (geminiError) {
  status = 'error';
  message = `AI analysis failed: ${geminiAnalysis.summary_text}`;
} else if (geminiAvailable) {
  status = 'complete';
  message = 'Analysis complete!';
}
```

### Fix #5: Update Frontend Error Handling
**File**: `components/UCIE/ProgressiveLoadingScreen.tsx`

**Change**:
```typescript
const pollStatus = async () => {
  const data: AnalysisStatus = await response.json();
  setStatus(data);
  
  // Check for error status
  if (data.status === 'error') {
    clearInterval(pollInterval);
    clearInterval(timeInterval);
    setError(data.message);
    onError?.(data.message);
    return;
  }
  
  // Check for complete status
  if (data.status === 'complete') {
    clearInterval(pollInterval);
    clearInterval(timeInterval);
    // Fetch full analysis...
  }
};
```

---

## 🧪 Testing Plan

### Test 1: Successful Gemini Generation
```
1. Analyze BTC
2. Wait for Phase 1 completion
3. Wait for Gemini analysis
4. Expected: ✅ 1500-2000 word analysis displayed
```

### Test 2: Gemini Timeout
```
1. Simulate slow Gemini response (>60s)
2. Expected: ✅ Error message displayed
3. Expected: ✅ Retry button available
4. Expected: ❌ No restart loop
```

### Test 3: Gemini API Error
```
1. Simulate Gemini API error
2. Expected: ✅ Error message displayed
3. Expected: ✅ Fallback summary shown
4. Expected: ❌ No restart loop
```

---

## 📊 Implementation Priority

### High Priority (Do Now):
1. ✅ Remove 45-second Gemini timeout
2. ✅ Store all summaries in database (even short ones)
3. ✅ Add error state to status endpoint
4. ✅ Update frontend error handling

### Medium Priority (Do Next):
1. Add retry button for failed analyses
2. Show partial results if Gemini fails
3. Add progress indicator during Gemini generation
4. Improve error messages

### Low Priority (Nice to Have):
1. Add Gemini generation progress tracking
2. Show estimated time remaining
3. Add cancel button
4. Add analysis history

---

## 🔧 Quick Fix (Immediate)

**The simplest fix to stop the restart loop:**

1. **Remove Gemini timeout** - Let it use full 60 seconds
2. **Store all summaries** - Even if < 500 chars
3. **Add analysis_type field** - Distinguish between 'summary', 'fallback', 'error'

**File**: `pages/api/ucie/preview-data/[symbol].ts`

```typescript
// Remove timeout wrapper
const response = await generateGeminiAnalysis(systemPrompt, context, 10000, 0.7);

// Store ALL summaries (remove 500-char check)
await storeGeminiAnalysis({
  symbol: normalizedSymbol,
  userId: userId || 'anonymous',
  userEmail: userEmail || 'anonymous@example.com',
  summaryText: summary,
  dataQualityScore: dataQuality,
  apiStatus: apiStatus,
  modelUsed: 'gemini-2.5-pro',
  analysisType: summary.length > 500 ? 'summary' : 'fallback', // ✅ Track type
  dataSourcesUsed: apiStatus.working,
  availableDataCount: apiStatus.working.length
});
```

---

## 📝 Expected Results After Fix

### Before Fix:
```
Phase 1: ✅ Complete (5/5 sources)
Phase 2: 🔄 Generating AI analysis...
         ⏱️ 5 minutes remaining...
         ⏱️ 4 minutes remaining...
         ⏱️ 3 minutes remaining...
         ❌ [Timeout - restart loop]
```

### After Fix:
```
Phase 1: ✅ Complete (5/5 sources)
Phase 2: 🔄 Generating AI analysis...
         ⏱️ Estimated 30-60 seconds...
         ✅ Analysis complete! (1,847 words)
         
OR (if error):
         ❌ Analysis failed: Gemini timeout
         📝 Showing basic summary instead
         🔄 [Retry button available]
```

---

## 🎯 Success Criteria

- [ ] Gemini analysis completes without timeout
- [ ] If Gemini fails, error is shown (not restart)
- [ ] Fallback summary is displayed if Gemini fails
- [ ] Status endpoint correctly reports errors
- [ ] Frontend handles all states (success, error, timeout)
- [ ] No restart loops
- [ ] User can retry failed analyses

---

**Status**: 📋 **FIX PLAN READY**  
**Priority**: CRITICAL - Blocking user experience  
**ETA**: 1-2 hours for complete fix  
**Next**: Implement timeout removal and error state storage
