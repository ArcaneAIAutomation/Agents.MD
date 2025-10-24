# Gemini AI Integration - Troubleshooting Guide

## Overview

This guide helps developers debug and resolve common issues with the Gemini AI integration for Whale Watch transaction analysis.

**Related Files:**
- API Implementation: `pages/api/whale-watch/analyze-gemini.ts`
- Deep Dive API: `pages/api/whale-watch/deep-dive-gemini.ts`
- Environment Config: `.env.example`
- Requirements: `.kiro/specs/gemini-model-upgrade/requirements.md`
- Design: `.kiro/specs/gemini-model-upgrade/design.md`

---

## Common Issues & Solutions

### 1. API Key Issues

#### Problem: "Invalid API key" or 401 Unauthorized

**Symptoms:**
```
❌ Gemini API error: 401 - Invalid API key
```

**Causes:**
- Missing `GEMINI_API_KEY` environment variable
- Invalid API key format
- Expired or revoked API key
- API key not activated

**Solutions:**

1. **Verify API key exists:**
   ```bash
   # Check if environment variable is set
   echo $GEMINI_API_KEY
   ```

2. **Validate API key format:**
   - Must start with `AIzaSy`
   - Must be exactly 39 characters long
   - Example: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

3. **Get a new API key:**
   - Visit: https://aistudio.google.com/app/apikey
   - Create new API key
   - Copy to `.env.local`
   - Restart development server

4. **Verify API key in Vercel (Production):**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure `GEMINI_API_KEY` is set for Production, Preview, and Development
   - Redeploy after adding/updating

**Debugging:**
```typescript
// Add to analyze-gemini.ts temporarily
console.log('API Key:', process.env.GEMINI_API_KEY ? 
  `${process.env.GEMINI_API_KEY.substring(0, 20)}...` : 
  'MISSING'
);
```

---

### 2. Rate Limit Errors

#### Problem: "Rate limit exceeded" or 429 Too Many Requests

**Symptoms:**
```
❌ Gemini API error: 429 - Rate limit exceeded
Retry-After: 60
```

**Causes:**
- Exceeded free tier limit (15 requests/minute)
- Exceeded paid tier limit (60 requests/minute)
- Multiple simultaneous requests
- No retry logic implemented

**Solutions:**

1. **Check current rate limits:**
   - Free tier: 15 requests/minute
   - Paid tier: 60 requests/minute
   - Enterprise: Custom limits

2. **Implement retry logic with exponential backoff:**
   ```typescript
   // Already implemented in analyze-gemini.ts
   // TODO: Uncomment retry logic in production
   async function callGeminiWithRetry(request, maxRetries = 2) {
     for (let attempt = 0; attempt <= maxRetries; attempt++) {
       try {
         return await callGeminiAPI(request);
       } catch (error) {
         if (error.status === 429 && attempt < maxRetries) {
           const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
           await sleep(delay);
           continue;
         }
         throw error;
       }
     }
   }
   ```

3. **Reduce request frequency:**
   - Add request queuing
   - Implement client-side rate limiting
   - Cache analysis results (5-minute TTL)

4. **Upgrade to paid tier:**
   - Visit: https://ai.google.dev/pricing
   - Upgrade for higher rate limits

**Debugging:**
```typescript
// Track request count
let requestCount = 0;
let windowStart = Date.now();

function checkRateLimit() {
  const now = Date.now();
  if (now - windowStart > 60000) {
    console.log(`Requests in last minute: ${requestCount}`);
    requestCount = 0;
    windowStart = now;
  }
  requestCount++;
}
```

---

### 3. Timeout Errors

#### Problem: Request times out before completion

**Symptoms:**
```
❌ Analysis timeout after 15 seconds
⚠️ Returning partial analysis with disclaimer
```

**Causes:**
- Network latency
- Large transaction requiring Deep Dive
- Gemini API slow response
- Timeout set too low

**Solutions:**

1. **Adjust timeout for Deep Dive:**
   ```bash
   # In .env.local
   GEMINI_TIMEOUT_MS=30000  # 30 seconds for Deep Dive
   ```

2. **Implement timeout handling:**
   ```typescript
   // Already implemented in deep-dive-gemini.ts
   const response = await fetch(url, {
     signal: AbortSignal.timeout(30000) // 30 second timeout
   });
   ```

3. **Return partial analysis on timeout:**
   ```typescript
   try {
     const analysis = await analyzeWithTimeout(whale, 15000);
     return analysis;
   } catch (error) {
     if (error.name === 'AbortError') {
       return {
         success: true,
         analysis: partialAnalysis,
         metadata: {
           note: 'Analysis completed with timeout, results may be incomplete'
         }
       };
     }
     throw error;
   }
   ```

4. **Monitor response times:**
   - Flash model: Should complete in < 5 seconds
   - Pro model: Should complete in < 10 seconds
   - Deep Dive: Should complete in < 20 seconds

**Debugging:**
```typescript
// Add timing logs
const startTime = Date.now();
console.log('🕐 Starting Gemini API call...');

const response = await fetch(url, options);

const endTime = Date.now();
console.log(`⏱️ Gemini API responded in ${endTime - startTime}ms`);
```

---

### 4. JSON Parsing Errors

#### Problem: Failed to parse Gemini response as JSON

**Symptoms:**
```
❌ Failed to parse Gemini response as JSON
❌ Parse error: Unexpected token < in JSON at position 0
```

**Causes:**
- Gemini returned HTML error page instead of JSON
- Response includes markdown code blocks
- Structured output not enabled
- Invalid JSON in response

**Solutions:**

1. **Enable structured output:**
   ```typescript
   generationConfig: {
     responseMimeType: 'application/json',  // Force JSON response
     responseSchema: analysisSchema,        // Provide schema
   }
   ```

2. **Clean response before parsing:**
   ```typescript
   // Already implemented in analyze-gemini.ts
   const jsonText = responseText
     .replace(/```json\n?/g, '')  // Remove markdown code blocks
     .replace(/```\n?/g, '')
     .trim();
   
   const analysis = JSON.parse(jsonText);
   ```

3. **Validate response structure:**
   ```typescript
   // Already implemented: validateAnalysisResponse()
   const errors = validateAnalysisResponse(analysis);
   if (errors.length > 0) {
     console.error('Validation errors:', errors);
     throw new Error('Invalid response structure');
   }
   ```

4. **Check for HTML error responses:**
   ```typescript
   if (responseText.startsWith('<')) {
     console.error('Received HTML instead of JSON:', responseText);
     throw new Error('Gemini returned HTML error page');
   }
   ```

**Debugging:**
```typescript
// Log raw response
console.log('Raw Gemini response:', responseText.substring(0, 500));

// Try to identify issue
if (responseText.includes('<!DOCTYPE')) {
  console.error('Response is HTML, not JSON');
} else if (responseText.includes('```')) {
  console.warn('Response contains markdown code blocks');
}
```

---

### 5. Validation Errors

#### Problem: Analysis response validation failed

**Symptoms:**
```
❌ Analysis response validation failed: Missing required field: confidence
❌ Invalid confidence value: 150. Must be between 0 and 100
```

**Causes:**
- Missing required fields in response
- Invalid field values (e.g., confidence > 100)
- Wrong field types (string instead of number)
- Array length constraints violated

**Solutions:**

1. **Review validation errors:**
   ```typescript
   const errors = validateAnalysisResponse(analysis);
   errors.forEach(error => console.error(`  - ${error}`));
   ```

2. **Check required fields:**
   - `transaction_type`: Must be one of: exchange_deposit, exchange_withdrawal, whale_to_whale, unknown
   - `market_impact`: Must be one of: Bearish, Bullish, Neutral
   - `confidence`: Number between 0-100
   - `reasoning`: String with minimum 100 characters
   - `key_findings`: Array with 3-10 items
   - `trader_action`: String with minimum 50 characters

3. **Normalize invalid values:**
   ```typescript
   // Already implemented in analyze-gemini.ts
   const normalizedAnalysis = {
     ...analysis,
     confidence: Math.min(100, Math.max(0, analysis.confidence || 75)),
     key_findings: Array.isArray(analysis.key_findings) ? 
       analysis.key_findings : [],
   };
   ```

4. **Update JSON schema if needed:**
   ```typescript
   // In generationConfig.responseSchema
   confidence: {
     type: 'number',
     minimum: 0,
     maximum: 100,
     description: 'Confidence score (0-100)'
   }
   ```

**Debugging:**
```typescript
// Log validation details
console.log('Validating analysis:', JSON.stringify(analysis, null, 2));
console.log('Validation errors:', validateAnalysisResponse(analysis));

// Check specific fields
console.log('confidence type:', typeof analysis.confidence);
console.log('confidence value:', analysis.confidence);
console.log('key_findings length:', analysis.key_findings?.length);
```

---

### 6. Thinking Mode Issues

#### Problem: Thinking content not appearing or empty

**Symptoms:**
```
🧠 Thinking mode: ENABLED
🧠 Extracted thinking content: 0 characters
```

**Causes:**
- Thinking mode not properly configured
- System instruction not included
- Response doesn't contain thinking content
- Extraction logic not working

**Solutions:**

1. **Verify thinking mode is enabled:**
   ```bash
   # In .env.local
   GEMINI_ENABLE_THINKING=true
   ```

2. **Check system instruction:**
   ```typescript
   systemInstruction: {
     parts: [{
       text: 'Show your step-by-step reasoning process before providing your final analysis.'
     }]
   }
   ```

3. **Improve thinking extraction:**
   ```typescript
   // Extract content before JSON
   const jsonStartIndex = responseText.indexOf('{');
   if (jsonStartIndex > 50) {
     thinkingContent = responseText.substring(0, jsonStartIndex).trim();
   }
   ```

4. **Request explicit thinking in prompt:**
   ```typescript
   const prompt = `Think through this step-by-step:
   1. Analyze the transaction pattern
   2. Consider market context
   3. Review historical precedents
   4. Formulate conclusion
   
   Then provide your analysis in JSON format...`;
   ```

**Debugging:**
```typescript
// Log thinking extraction
console.log('Response length:', responseText.length);
console.log('JSON start index:', responseText.indexOf('{'));
console.log('Thinking content length:', thinkingContent?.length || 0);
console.log('First 200 chars:', responseText.substring(0, 200));
```

---

### 7. Deep Dive Blockchain Data Issues

#### Problem: Blockchain data fetch fails or returns incomplete data

**Symptoms:**
```
⚠️ Blockchain data fetch encountered 2 error(s)
⚠️ Data source limitations (3): Rate limit exceeded, Address not found
```

**Causes:**
- Blockchain.com API rate limits
- Invalid Bitcoin addresses
- Network connectivity issues
- API key missing or invalid

**Solutions:**

1. **Handle blockchain data failures gracefully:**
   ```typescript
   // Already implemented in deep-dive-gemini.ts
   const deepDiveResult = await fetchDeepDiveData(fromAddress, toAddress);
   
   if (!deepDiveResult.success) {
     console.warn('Blockchain data unavailable, proceeding with analysis');
     // Continue with available data
   }
   ```

2. **Implement exponential backoff for rate limits:**
   ```typescript
   async function fetchWithRetry(url, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fetch(url);
       } catch (error) {
         if (error.status === 429) {
           await sleep(Math.pow(2, i) * 1000);
           continue;
         }
         throw error;
       }
     }
   }
   ```

3. **Cache blockchain data:**
   ```typescript
   // Implement 5-minute TTL cache
   const cache = new Map();
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   
   function getCachedData(address) {
     const cached = cache.get(address);
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data;
     }
     return null;
   }
   ```

4. **Display data source limitations:**
   ```typescript
   // Already implemented in metadata
   metadata: {
     blockchainDataAvailable: false,
     dataSourceLimitations: [
       'Blockchain.com API rate limit exceeded',
       'Using general market knowledge instead'
     ]
   }
   ```

**Debugging:**
```typescript
// Log blockchain data fetch
console.log('Fetching blockchain data for:', fromAddress, toAddress);
console.log('Blockchain data result:', {
  success: result.success,
  errors: result.errors,
  limitations: result.dataSourceLimitations
});
```

---

### 8. Model Selection Issues

#### Problem: Wrong model being used for transaction size

**Symptoms:**
```
📊 Using model: gemini-2.0-flash-exp
Expected: gemini-2.5-pro for 150 BTC transaction
```

**Causes:**
- Model selection logic not implemented
- Environment variable override
- Hardcoded model name
- Threshold not configured

**Solutions:**

1. **Implement model selection logic:**
   ```typescript
   // TODO: Implement in analyze-gemini.ts
   function selectGeminiModel(amountBTC: number): string {
     const threshold = parseInt(process.env.GEMINI_PRO_THRESHOLD_BTC || '100');
     
     if (amountBTC >= threshold) {
       return 'gemini-2.5-pro';
     }
     
     return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
   }
   
   const model = selectGeminiModel(whale.amount);
   console.log(`📊 Selected model: ${model} for ${whale.amount} BTC`);
   ```

2. **Configure threshold:**
   ```bash
   # In .env.local
   GEMINI_PRO_THRESHOLD_BTC=100
   ```

3. **Allow user override:**
   ```typescript
   interface GeminiAnalysisRequest {
     // ... existing fields
     modelPreference?: 'flash' | 'pro';  // Optional override
   }
   
   const model = whale.modelPreference === 'pro' 
     ? 'gemini-2.5-pro'
     : selectGeminiModel(whale.amount);
   ```

**Debugging:**
```typescript
// Log model selection
console.log('Transaction amount:', whale.amount, 'BTC');
console.log('Threshold:', process.env.GEMINI_PRO_THRESHOLD_BTC);
console.log('Selected model:', model);
console.log('Model preference:', whale.modelPreference);
```

---

### 9. Cost Management Issues

#### Problem: Unexpected high API costs

**Symptoms:**
- Monthly bill higher than expected
- Many Pro model calls for small transactions
- Large output token usage

**Causes:**
- Using Pro model unnecessarily
- High maxOutputTokens setting
- No cost tracking
- Frequent retries

**Solutions:**

1. **Monitor token usage:**
   ```typescript
   // Log token usage from response
   const usage = geminiData.usageMetadata;
   console.log('Token usage:', {
     promptTokens: usage?.promptTokenCount,
     responseTokens: usage?.candidatesTokenCount,
     totalTokens: usage?.totalTokenCount
   });
   ```

2. **Optimize maxOutputTokens:**
   ```bash
   # In .env.local
   GEMINI_FLASH_MAX_OUTPUT_TOKENS=8192   # Sufficient for most analyses
   GEMINI_PRO_MAX_OUTPUT_TOKENS=16384    # Reduce from 32768 if possible
   ```

3. **Implement cost tracking:**
   ```typescript
   const COST_PER_1K_TOKENS = {
     'gemini-2.5-flash': { input: 0.00001, output: 0.00003 },
     'gemini-2.5-pro': { input: 0.00005, output: 0.00015 }
   };
   
   function calculateCost(model, inputTokens, outputTokens) {
     const costs = COST_PER_1K_TOKENS[model];
     return (inputTokens / 1000 * costs.input) + 
            (outputTokens / 1000 * costs.output);
   }
   ```

4. **Cache analysis results:**
   ```typescript
   // Cache identical transaction analyses
   const cacheKey = `${whale.txHash}-${whale.amount}`;
   const cached = analysisCache.get(cacheKey);
   
   if (cached && Date.now() - cached.timestamp < 300000) {
     return cached.analysis; // Return cached result
   }
   ```

**Debugging:**
```typescript
// Track costs per request
console.log('Estimated cost:', calculateCost(model, promptTokens, responseTokens));
console.log('Model used:', model);
console.log('Output tokens:', responseTokens);
```

---

## Debugging Checklist

When troubleshooting Gemini integration issues:

- [ ] Check environment variables are set correctly
- [ ] Verify API key format and validity
- [ ] Review console logs for error messages
- [ ] Check network connectivity
- [ ] Verify request/response structure
- [ ] Test with smaller transactions first
- [ ] Monitor rate limits and costs
- [ ] Check Vercel deployment logs (production)
- [ ] Validate JSON schema compliance
- [ ] Review thinking mode configuration
- [ ] Test blockchain data fetch separately
- [ ] Verify model selection logic

---

## Getting Help

### Internal Resources
- **Requirements**: `.kiro/specs/gemini-model-upgrade/requirements.md`
- **Design**: `.kiro/specs/gemini-model-upgrade/design.md`
- **Tasks**: `.kiro/specs/gemini-model-upgrade/tasks.md`
- **API Code**: `pages/api/whale-watch/analyze-gemini.ts`
- **Deep Dive**: `pages/api/whale-watch/deep-dive-gemini.ts`

### External Resources
- **Gemini API Docs**: https://ai.google.dev/docs
- **API Reference**: https://ai.google.dev/api/rest
- **Pricing**: https://ai.google.dev/pricing
- **Get API Key**: https://aistudio.google.com/app/apikey
- **Community**: https://discuss.ai.google.dev/

### Support Channels
1. Check GitHub Issues for similar problems
2. Review Vercel deployment logs
3. Test in local development first
4. Contact Gemini API support for API-specific issues

---

## Performance Optimization Tips

1. **Use Flash model by default**: Only use Pro for large transactions
2. **Implement caching**: Cache analysis results for 5 minutes
3. **Batch requests**: Combine multiple analyses when possible
4. **Monitor response times**: Track and optimize slow endpoints
5. **Reduce output tokens**: Use minimum tokens needed for analysis
6. **Implement request queuing**: Prevent rate limit errors
7. **Use CDN caching**: Cache static analysis results
8. **Optimize prompts**: Shorter prompts = lower costs

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
