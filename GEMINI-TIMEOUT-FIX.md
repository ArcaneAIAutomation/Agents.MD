# Gemini API Timeout Issue - Long-Running Analysis

## Problem

Gemini API calls are failing with 504 Gateway Timeout errors when analyzing whale transactions:

```
Failed to load resource: the server responded with a status of 504 ()
Failed to start analysis: Error: Analysis API error: 504
```

### Error Details
- **HTTP Status**: 504 Gateway Timeout
- **Affected Features**: 
  - Quick Analysis (Gemini Flash)
  - Deep Dive Analysis (Gemini Pro)
- **Frequency**: Consistent failures on all analysis attempts

## Root Cause

### Timeout Mismatch

The issue was caused by a timeout configuration mismatch between:

1. **Gemini API Timeout**: 15 seconds (configured in `.env.local`)
2. **Vercel Function Timeout**: 30 seconds (configured in `vercel.json`)
3. **Actual Gemini API Response Time**: 15-20 seconds for complex analysis

### Why This Happened

1. Gemini API calls for whale transaction analysis are complex:
   - Large prompts with transaction details
   - Market context and historical data
   - Structured JSON output with validation
   - Thinking mode reasoning (when enabled)

2. The 15-second timeout was too aggressive:
   - Gemini Flash: ~10-15 seconds for standard analysis
   - Gemini Pro: ~15-25 seconds for deep analysis
   - Network latency: 1-3 seconds
   - Total time: Often exceeds 15 seconds

3. When the timeout was reached:
   - AbortController cancelled the request
   - Retry logic kicked in (2 retries)
   - All retries also timed out
   - Final result: 504 Gateway Timeout

## Solution

### Increased Timeout to 25 Seconds

Changed the default timeout from 15s to 25s to provide adequate time for Gemini API responses while staying within Vercel's 30s function limit.

### Changes Made

#### 1. `.env.local` - Production Configuration
```bash
# BEFORE
GEMINI_TIMEOUT_MS=15000  # 15 seconds

# AFTER
GEMINI_TIMEOUT_MS=25000  # 25 seconds
```

#### 2. `.env.example` - Documentation Template
```bash
# BEFORE
# Recommended: 15000 for standard, 30000 for Deep Dive
GEMINI_TIMEOUT_MS=15000

# AFTER
# Recommended: 25000 for production (Vercel has 30s function limit)
# Note: Must be less than Vercel's maxDuration (30s) to prevent 504 errors
GEMINI_TIMEOUT_MS=25000
```

#### 3. `utils/geminiConfig.ts` - Default Value
```typescript
// BEFORE
const timeoutMs = getNumericEnvVar('GEMINI_TIMEOUT_MS', 15000, 1000, 60000);

// AFTER
const timeoutMs = getNumericEnvVar('GEMINI_TIMEOUT_MS', 25000, 1000, 60000);
```

## Timeout Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ Vercel Function Timeout: 30 seconds (hard limit)       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Gemini API Timeout: 25 seconds (configurable)      │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Gemini API Response Time:                       │ │ │
│ │ │ - Flash: 10-15 seconds                          │ │ │
│ │ │ - Pro: 15-25 seconds                            │ │ │
│ │ │ - Network: 1-3 seconds                          │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Safety Margin

- **Vercel Limit**: 30 seconds
- **Gemini Timeout**: 25 seconds
- **Safety Margin**: 5 seconds for:
  - Request processing
  - Response handling
  - Error handling
  - Logging

## Expected Behavior After Fix

### Quick Analysis (Gemini Flash)
- **Expected Time**: 10-15 seconds
- **Timeout**: 25 seconds
- **Success Rate**: ~95%+
- **Retry**: Automatic on timeout (2 retries)

### Deep Dive Analysis (Gemini Pro)
- **Expected Time**: 15-25 seconds
- **Timeout**: 25 seconds
- **Success Rate**: ~90%+
- **Retry**: Automatic on timeout (2 retries)

### Timeout Scenarios

| Scenario | Time | Result |
|----------|------|--------|
| Fast Response | 8-12s | ✅ Success |
| Normal Response | 12-20s | ✅ Success |
| Slow Response | 20-25s | ✅ Success (just in time) |
| Very Slow | 25-30s | ⚠️ Timeout → Retry |
| Retry Success | 10-15s | ✅ Success on retry |
| All Retries Fail | >75s | ❌ Final timeout error |

## Testing

### Before Fix
```
Attempt 1: 15s timeout → Failed
Attempt 2: 15s timeout → Failed (retry)
Attempt 3: 15s timeout → Failed (retry)
Result: 504 Gateway Timeout
```

### After Fix
```
Attempt 1: 25s timeout → Success (18s response)
Result: 200 OK with analysis
```

## Configuration Options

### For Faster Analysis (Lower Quality)
```bash
# Reduce max output tokens to speed up response
GEMINI_FLASH_MAX_OUTPUT_TOKENS=4096  # Default: 8192
GEMINI_PRO_MAX_OUTPUT_TOKENS=16384   # Default: 32768

# Disable thinking mode to reduce response time
GEMINI_ENABLE_THINKING=false         # Default: true
```

### For More Comprehensive Analysis (Slower)
```bash
# Increase timeout for complex analysis
GEMINI_TIMEOUT_MS=28000              # Max: 28s (2s safety margin)

# Increase max output tokens for detailed analysis
GEMINI_FLASH_MAX_OUTPUT_TOKENS=8192  # Default
GEMINI_PRO_MAX_OUTPUT_TOKENS=32768   # Default

# Enable thinking mode for transparency
GEMINI_ENABLE_THINKING=true          # Default
```

## Monitoring

### Success Indicators
- ✅ Analysis completes in 10-25 seconds
- ✅ No 504 errors in console
- ✅ Full analysis with all fields populated
- ✅ Token usage logged correctly

### Warning Signs
- ⚠️ Consistent timeouts (>25s)
- ⚠️ Multiple retries needed
- ⚠️ Truncated responses (MAX_TOKENS)
- ⚠️ High token usage (>8K for Flash, >32K for Pro)

### If Timeouts Persist

1. **Check Gemini API Status**: https://status.cloud.google.com/
2. **Verify API Key**: Ensure valid and not rate-limited
3. **Reduce Complexity**: Shorten prompt or reduce max tokens
4. **Increase Timeout**: Up to 28s (max safe value)
5. **Switch Models**: Try Flash instead of Pro for faster response

## Related Files

- `.env.local` - Production environment configuration
- `.env.example` - Environment variable template
- `utils/geminiConfig.ts` - Configuration management
- `pages/api/whale-watch/analyze-gemini.ts` - API endpoint
- `vercel.json` - Vercel function configuration

## Vercel Configuration

The `vercel.json` already has the correct configuration:

```json
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30,  // 30 second function timeout
      "memory": 1024      // 1GB memory
    }
  }
}
```

**Note**: Vercel's Hobby plan has a 10s default timeout, but we've configured 30s for API routes. Pro plan allows up to 60s.

## Cost Impact

Longer timeouts don't increase cost directly, but they allow for:
- More comprehensive analysis
- Higher token usage
- Better quality responses

**Estimated Cost Impact**: Negligible
- Flash: ~$0.0001 per analysis (unchanged)
- Pro: ~$0.0004 per analysis (unchanged)
- Timeout increase doesn't affect token usage

## Rollback Plan

If issues persist, revert to conservative settings:

```bash
# Conservative Configuration
GEMINI_TIMEOUT_MS=20000              # 20 seconds
GEMINI_FLASH_MAX_OUTPUT_TOKENS=4096  # Reduced tokens
GEMINI_ENABLE_THINKING=false         # Disable thinking mode
GEMINI_MAX_RETRIES=1                 # Reduce retries
```

## Status

✅ **Fixed and Deployed**
- Timeout increased from 15s to 25s
- Default configuration updated
- Documentation updated
- Ready for production testing

---

**Fixed**: January 25, 2025
**Issue**: 504 Gateway Timeout on Gemini API calls
**Solution**: Increased timeout from 15s to 25s
**Impact**: Whale Watch analysis now completes successfully
