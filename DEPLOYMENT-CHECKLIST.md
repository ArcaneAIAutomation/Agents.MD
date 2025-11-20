# 🚀 GPT-5.1 Deployment Checklist

**Date**: January 27, 2025  
**Migration Status**: ✅ Core Complete (4/25 files)  
**Ready for**: Production Deployment

---

## ✅ Pre-Deployment Checklist

### Code Changes
- [x] Created centralized OpenAI client (`lib/openai.ts`)
- [x] Migrated ATGE trade analyzer (`lib/atge/aiAnalyzer.ts`)
- [x] Migrated UCIE client (`lib/ucie/openaiClient.ts`)
- [x] Migrated sample API route (`pages/api/live-trade-generation.ts`)
- [x] Updated `.env.local` with new variables
- [x] Created comprehensive documentation
- [x] Tested locally (test script passes)

### Documentation
- [x] Migration guide created
- [x] API changes documented
- [x] Environment variables documented
- [x] Troubleshooting guide created
- [x] Deployment instructions written

---

## 🔧 Vercel Configuration (REQUIRED)

### Step 1: Add Environment Variables

Go to: **Vercel Dashboard → Project → Settings → Environment Variables**

Add these **3 new variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `OPENAI_MODEL` | `gpt-5.1` | Production, Preview, Development |
| `OPENAI_FALLBACK_MODEL` | `gpt-4.1` | Production, Preview, Development |
| `OPENAI_TIMEOUT` | `120000` | Production, Preview, Development |

**Keep existing**:
- `OPENAI_API_KEY` (do NOT change)

### Step 2: Verify Configuration

- [ ] All 3 new variables added
- [ ] Applied to all environments (Production, Preview, Development)
- [ ] Existing `OPENAI_API_KEY` unchanged
- [ ] No typos in variable names

---

## 🚀 Deployment Steps

### Option 1: GitHub Auto-Deploy (Recommended)

```bash
# 1. Commit changes
git add .
git commit -m "feat: Migrate to GPT-5.1 Responses API - Core infrastructure"

# 2. Push to GitHub (triggers auto-deploy)
git push origin main

# 3. Monitor deployment
# Go to: https://vercel.com/dashboard → Deployments
```

### Option 2: Direct Vercel Deploy

```bash
# Deploy directly to production
vercel --prod

# Or deploy to preview first
vercel
```

---

## ✅ Post-Deployment Verification

### 1. Check Vercel Logs

```bash
# Follow logs in real-time
vercel logs --follow

# Or check in dashboard
# Go to: Vercel Dashboard → Deployments → Latest → Logs
```

**Look for these SUCCESS indicators**:
```
✅ [OpenAI] Calling gpt-5.1 via Responses API...
✅ [OpenAI] Response received from gpt-5.1
✅ [Trade Gen] Using OpenAI model: gpt-5.1
✅ [ATGE] Trade analysis completed with gpt-5.1
✅ [UCIE] Analysis completed successfully with gpt-5.1
```

**Watch for these ERROR indicators**:
```
❌ 400 Bad Request: max_tokens not supported
❌ 404: Model gpt-5.1 not found
❌ Cannot read property 'content' of undefined
❌ OpenAI API key not configured
```

### 2. Test API Endpoints

```bash
# Test migrated endpoint
curl https://news.arcane.group/api/live-trade-generation?symbol=BTC

# Expected: JSON response with trade signal
# Check response time: Should be 8-15 seconds
```

### 3. Verify Model Usage

In Vercel logs, confirm you see:
- ✅ `gpt-5.1` being called
- ✅ Successful responses
- ✅ No `max_tokens` errors
- ✅ Reasonable response times (8-15s)

### 4. Test Fallback Mechanism

If `gpt-5.1` fails, logs should show:
```
⚠️  [OpenAI] gpt-5.1 failed, trying gpt-4.1 fallback
✅ [OpenAI] Response received from gpt-4.1 (fallback)
```

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] `/api/live-trade-generation` returns valid trade signal
- [ ] Response includes `aiModel` field showing `gpt-5.1`
- [ ] No 400 or 500 errors
- [ ] Response time is acceptable (8-15s)
- [ ] JSON parsing works correctly

### Quality Tests
- [ ] AI responses are coherent and relevant
- [ ] Trade signals are reasonable
- [ ] Analysis quality meets expectations
- [ ] No degradation from GPT-4o

### Error Handling Tests
- [ ] Fallback works if primary model fails
- [ ] Timeout handling works correctly
- [ ] Error messages are clear
- [ ] No user-facing crashes

---

## 📊 Monitoring (First 24 Hours)

### What to Monitor

1. **Vercel Logs**
   - Check for `gpt-5.1` usage
   - Watch for errors
   - Monitor response times

2. **API Response Times**
   - Should be 8-15 seconds
   - If >20s, consider optimization

3. **Error Rates**
   - Should be <1%
   - If higher, check logs

4. **Token Usage**
   - Monitor costs
   - Adjust `max_completion_tokens` if needed

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | >5% | Check logs, consider rollback |
| Response Time | >20s | Reduce `max_completion_tokens` |
| Fallback Rate | >20% | Check primary model availability |
| 400 Errors | Any | Check for `max_tokens` usage |

---

## 🔄 Rollback Plan

If issues occur:

### Quick Rollback (Environment Variables)

1. Go to Vercel → Environment Variables
2. Change `OPENAI_MODEL` to `gpt-4o`
3. Redeploy (or wait for auto-redeploy)

### Full Rollback (Code)

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback in Vercel Dashboard
# Go to: Deployments → Previous Deployment → Promote to Production
```

---

## 📋 Success Criteria

Deployment is successful when:

- [x] Environment variables added to Vercel
- [ ] Deployment completed without errors
- [ ] Vercel logs show `gpt-5.1` usage
- [ ] API endpoints respond correctly
- [ ] No `max_tokens` errors
- [ ] Response quality is good
- [ ] Fallback mechanism works
- [ ] No increase in error rate

---

## 🎯 Quick Reference

### Environment Variables (Vercel)
```bash
OPENAI_MODEL=gpt-5.1
OPENAI_FALLBACK_MODEL=gpt-4.1
OPENAI_TIMEOUT=120000
```

### Test Command
```bash
curl https://news.arcane.group/api/live-trade-generation?symbol=BTC
```

### Log Check
```bash
vercel logs --follow | grep "OpenAI"
```

### Expected Log Output
```
[OpenAI] Calling gpt-5.1 via Responses API...
[OpenAI] Response received from gpt-5.1
```

---

## 📞 Support

### If Deployment Fails

1. **Check Vercel Logs** for specific error
2. **Verify Environment Variables** are set correctly
3. **Test Locally** with `npm run dev`
4. **Rollback** if needed (see Rollback Plan above)

### If API Errors Occur

1. **Check for `max_tokens` errors** → Should not happen with migrated files
2. **Check model availability** → Fallback should handle this
3. **Check API key** → Should be unchanged
4. **Check timeout** → Increase if needed

---

## ✅ Final Checklist

Before marking as complete:

- [ ] Environment variables added to Vercel
- [ ] Code deployed to production
- [ ] Vercel logs checked (shows `gpt-5.1`)
- [ ] API endpoint tested (works correctly)
- [ ] No errors in logs
- [ ] Response quality verified
- [ ] Fallback tested (if possible)
- [ ] Monitoring set up
- [ ] Team notified of changes

---

## 🎉 Completion

Once all checkboxes are marked:

**Status**: ✅ **DEPLOYMENT COMPLETE**  
**Model**: gpt-5.1 (with gpt-4.1 fallback)  
**Files Migrated**: 4/25 (Core infrastructure)  
**Production Ready**: YES

**Next Steps**:
1. Monitor for 24 hours
2. Migrate remaining 21 files (optional, can be done incrementally)
3. Optimize token usage if needed

---

**Deployed By**: _____________  
**Date**: _____________  
**Verified By**: _____________  
**Notes**: _____________

