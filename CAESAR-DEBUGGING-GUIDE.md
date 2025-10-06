# Caesar API Debugging Guide

## What I've Discovered

### Issue: Analysis Polling Timeout
The whale analysis is timing out after 60 attempts (2 minutes). This suggests either:
1. Caesar API is taking longer than expected (>2 minutes)
2. The job is failing silently on Caesar's side
3. There's a network/connectivity issue
4. The API response structure doesn't match our expectations

### Changes Made for Debugging

#### 1. Enhanced Logging in Caesar Client (`utils/caesarClient.ts`)
```typescript
// Now logs:
- 🌐 Caesar API Request: POST /research
- 📡 Caesar API Response: 200 OK
- ✅ Caesar API Success: {response preview}
- ❌ Caesar API Error: {error details}
```

#### 2. Detailed Logging in Analyze Endpoint (`pages/api/whale-watch/analyze.ts`)
```typescript
// Now logs:
- 📤 Sending request to Caesar API...
- Query length: X chars
- System prompt length: Y chars
- ✅ Caesar job created successfully
- Job ID: {id}
- Initial status: {status}
- Full response: {JSON}
```

#### 3. Frontend Polling Logs (`components/WhaleWatch/WhaleWatchDashboard.tsx`)
```typescript
// Now logs:
- 📊 Polling attempt X/60 for job {id}
- 📡 Poll response: {data}
- ⏳ Still {status}, polling again in 2s...
- ✅ Analysis completed!
- ❌ Analysis failed on server
```

#### 4. Test Endpoint (`pages/api/test-caesar.ts`)
Created a dedicated test endpoint to verify Caesar API connectivity:
- Tests job creation
- Tests status polling
- Waits up to 30 seconds for completion
- Returns detailed diagnostics

## How to Debug

### Step 1: Test Caesar API Directly
Visit: `http://localhost:3000/api/test-caesar`

This will:
1. Create a simple test job ("What is Bitcoin?")
2. Poll for completion
3. Return detailed diagnostics

**Expected Output:**
```json
{
  "success": true,
  "message": "Caesar API test completed",
  "jobId": "uuid-here",
  "initialStatus": "queued",
  "finalStatus": "completed",
  "hasContent": true,
  "hasTransformedContent": true,
  "content": "Bitcoin is...",
  "results": 5
}
```

### Step 2: Check Server Console Logs
When you click "Analyze with Caesar AI", watch the server console for:

```
🤖 Analyzing whale transaction: bc1qgdjqv0av3q56...
📊 Transaction: 143.11 BTC ($17.73M) - Type: unknown
📤 Sending request to Caesar API...
Query length: 450 chars
System prompt length: 280 chars
🌐 Caesar API Request: POST /research
📡 Caesar API Response: 200 OK
✅ Caesar API Success: {"id":"...","status":"queued"}
✅ Caesar job created successfully
Job ID: f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10
Initial status: queued
```

### Step 3: Check Browser Console Logs
Watch the browser console for polling activity:

```
📊 Polling attempt 1/60 for job f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10
📡 Poll response: {success: true, status: "queued", timestamp: "..."}
⏳ Still queued, polling again in 2s...

📊 Polling attempt 2/60 for job f2f6e5db-2c7d-4f56-bb0c-5a6b6a7a9b10
📡 Poll response: {success: true, status: "researching", timestamp: "..."}
⏳ Still researching, polling again in 2s...

... (continues until completed or timeout)
```

### Step 4: Check Network Tab
Open browser DevTools → Network tab:
1. Look for `/api/whale-watch/analyze` (POST) - Should return 200 with jobId
2. Look for `/api/whale-watch/analysis/{jobId}` (GET) - Should return 200 with status updates

## Common Issues & Solutions

### Issue 1: "CAESAR_API_KEY not found"
**Symptom:** Error in server logs
**Solution:** 
```bash
# Check .env.local has:
CAESAR_API_KEY=sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII

# Restart dev server:
npm run dev
```

### Issue 2: "Caesar 401: Unauthorized"
**Symptom:** API returns 401 error
**Solution:** 
- API key is invalid or expired
- Check Caesar dashboard for key status
- Generate new API key if needed

### Issue 3: "Caesar 429: Too Many Requests"
**Symptom:** Rate limit exceeded
**Solution:**
- Wait a few minutes before retrying
- Reduce compute_units (currently set to 2)
- Check Caesar dashboard for rate limits

### Issue 4: Job Stays "queued" Forever
**Symptom:** Status never changes from "queued"
**Solution:**
- Caesar API may be experiencing high load
- Check Caesar status page
- Try with compute_units: 1 for faster processing

### Issue 5: Job Completes But No Content
**Symptom:** status="completed" but content=null
**Solution:**
- Check server logs for parsing errors
- Query may be too vague or complex
- Try simpler query first

### Issue 6: Polling Timeout After 2 Minutes
**Symptom:** "Analysis polling timeout" error
**Solution:**
- Increase maxAttempts in dashboard (currently 60)
- Reduce compute_units for faster completion
- Check if job actually completed on Caesar's side

## Debugging Checklist

- [ ] Test endpoint returns success: `/api/test-caesar`
- [ ] Server logs show "Caesar job created successfully"
- [ ] Browser console shows polling attempts
- [ ] Network tab shows 200 responses
- [ ] Job status progresses: queued → researching → completed
- [ ] Server logs show "Analysis complete for job"
- [ ] Browser console shows "Analysis completed!"
- [ ] UI displays analysis results

## Next Steps Based on Findings

### If Test Endpoint Fails:
1. Check Caesar API key validity
2. Verify network connectivity to api.caesar.xyz
3. Check firewall/proxy settings
4. Try different compute_units value

### If Test Endpoint Succeeds But Whale Analysis Fails:
1. Compare query complexity (test vs whale)
2. Check system_prompt formatting
3. Verify whale transaction data is valid
4. Try with simpler query first

### If Polling Times Out:
1. Check actual job status on Caesar dashboard
2. Increase maxAttempts to 120 (4 minutes)
3. Reduce compute_units to 1
4. Add manual "Check Status" button

### If Content Parsing Fails:
1. Check raw transformed_content in logs
2. Verify JSON structure matches expected format
3. Update fallback logic
4. Consider using content instead of transformed_content

## Manual Testing Commands

### Test Caesar API with cURL:
```bash
# Create job
curl -X POST https://api.caesar.xyz/research \
  -H "Authorization: Bearer sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is Bitcoin?","compute_units":1}'

# Check status (replace {id} with job ID from above)
curl https://api.caesar.xyz/research/{id} \
  -H "Authorization: Bearer sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII"
```

## Monitoring

Watch these logs in real-time:
```bash
# Server logs
npm run dev

# Browser console
F12 → Console tab

# Network activity
F12 → Network tab → Filter: "whale-watch"
```

## Expected Timeline

With compute_units=2:
- 0s: Job created (status: queued)
- 0-10s: Job starts (status: researching)
- 10-120s: Research in progress
- 120s: Job completes (status: completed)

If it takes longer than 2 minutes, either:
- Increase timeout
- Reduce compute_units
- Check Caesar API status
