# UCIE Action Checklist - Quick Reference

## ✅ Status: Database Working, Ready for Integration

---

## 🎯 This Week's Tasks (8-10 hours total)

### Day 1-2: Update API Endpoints (4-6 hours)

#### Endpoint Update Pattern
```typescript
// Add at top of file
import { getCachedAnalysis, setCachedAnalysis } from '../../../lib/ucie/cacheUtils';

// In handler function, before fetching data:
const cached = await getCachedAnalysis(symbol, 'ANALYSIS_TYPE');
if (cached) {
  return res.status(200).json(cached);
}

// After fetching fresh data:
await setCachedAnalysis(symbol, 'ANALYSIS_TYPE', data, TTL_SECONDS);
```

#### Files to Update (in priority order):

- [ ] **1. `/api/ucie/research/[symbol].ts`** (30 min)
  - Analysis type: `'research'`
  - TTL: `86400` (24 hours)
  - Priority: CRITICAL (Phase 4 depends on this)

- [ ] **2. `/api/ucie/market-data/[symbol].ts`** (30 min)
  - Analysis type: `'market-data'`
  - TTL: `300` (5 minutes)
  - Priority: HIGH (Phase 1)

- [ ] **3. `/api/ucie/technical/[symbol].ts`** (30 min)
  - Analysis type: `'technical'`
  - TTL: `60` (1 minute)
  - Priority: HIGH (Phase 3)

- [ ] **4. `/api/ucie/sentiment/[symbol].ts`** (30 min)
  - Analysis type: `'sentiment'`
  - TTL: `300` (5 minutes)
  - Priority: HIGH (Phase 2)

- [ ] **5. `/api/ucie/news/[symbol].ts`** (30 min)
  - Analysis type: `'news'`
  - TTL: `300` (5 minutes)
  - Priority: HIGH (Phase 2)

- [ ] **6. `/api/ucie/on-chain/[symbol].ts`** (30 min)
  - Analysis type: `'on-chain'`
  - TTL: `300` (5 minutes)
  - Priority: MEDIUM (Phase 3)

- [ ] **7. `/api/ucie/predictions/[symbol].ts`** (30 min)
  - Analysis type: `'predictions'`
  - TTL: `3600` (1 hour)
  - Priority: MEDIUM (Phase 3)

- [ ] **8. `/api/ucie/risk/[symbol].ts`** (30 min)
  - Analysis type: `'risk'`
  - TTL: `3600` (1 hour)
  - Priority: MEDIUM (Phase 3)

- [ ] **9. `/api/ucie/derivatives/[symbol].ts`** (30 min)
  - Analysis type: `'derivatives'`
  - TTL: `300` (5 minutes)
  - Priority: LOW (Phase 3)

- [ ] **10. `/api/ucie/defi/[symbol].ts`** (30 min)
  - Analysis type: `'defi'`
  - TTL: `3600` (1 hour)
  - Priority: LOW (Phase 3)

**Total Time**: 5-6 hours

---

### Day 3: Create Store Phase Data Endpoint (30 minutes)

- [ ] **Create `/api/ucie/store-phase-data.ts`**
  - Accept: sessionId, symbol, phaseNumber, data
  - Store using `storePhaseData()` from `lib/ucie/phaseDataStorage.ts`
  - Return success/failure
  - See implementation in UCIE-STATUS-REPORT.md

**Total Time**: 30 minutes

---

### Day 3: Update Progressive Loading Hook (1 hour)

- [ ] **Update `hooks/useProgressiveLoading.ts`**
  - Generate unique session ID on mount: `const sessionId = useMemo(() => uuidv4(), [])`
  - After each phase completes, call `/api/ucie/store-phase-data`
  - Pass session ID to Phase 4 instead of context data
  - Update Phase 4 API call: `/api/ucie/research/${symbol}?sessionId=${sessionId}`

**Total Time**: 1 hour

---

### Day 4: Test End-to-End (2 hours)

- [ ] **Test BTC Analysis**
  - Open browser console
  - Search for "BTC"
  - Click "Analyze"
  - Watch all 4 phases complete
  - Verify console logs show phase data storage
  - Verify Phase 4 completes successfully

- [ ] **Test Caching**
  - Run BTC analysis again
  - Should be instant (< 1 second)
  - Verify "Retrieved from cache" messages

- [ ] **Test Resumable Analysis**
  - Start BTC analysis
  - Refresh page during Phase 4
  - Verify analysis resumes from Phase 4

- [ ] **Test ETH Analysis**
  - Repeat above tests with ETH
  - Verify all phases work

**Total Time**: 2 hours

---

### Day 5: Fix Issues & Optimize (2-3 hours)

- [ ] **Fix any bugs discovered**
- [ ] **Optimize slow endpoints**
- [ ] **Update documentation**
- [ ] **Commit and push changes**

**Total Time**: 2-3 hours

---

## 📊 Progress Tracking

### Completion Status

**Endpoints Updated**: 0/10 (0%)  
**Store Phase Data**: Not started  
**Progressive Loading**: Not started  
**Testing**: Not started  

**Overall Progress**: 85% → 100% (15% remaining)

---

## 🚀 Quick Commands

### Verify Database
```bash
npx tsx scripts/verify-database-storage.ts
```

### Test Specific Endpoint
```bash
# Test market data endpoint
curl http://localhost:3000/api/ucie/market-data/BTC

# Test research endpoint
curl http://localhost:3000/api/ucie/research/BTC
```

### Check Logs
```bash
# Vercel logs (production)
vercel logs

# Local development
npm run dev
# Then check browser console
```

---

## 📚 Reference Files

**Implementation Guides**:
- `UCIE-STATUS-REPORT.md` - Complete status and implementation details
- `UCIE-COMPLETE-FIX-SUMMARY.md` - Summary of all fixes
- `UCIE-DATABASE-STATUS.md` - Database setup and verification

**Code References**:
- `lib/ucie/cacheUtils.ts` - Caching utilities
- `lib/ucie/phaseDataStorage.ts` - Phase data storage
- `migrations/002_ucie_tables.sql` - Database schema

**Testing**:
- `scripts/verify-database-storage.ts` - Database verification
- `__tests__/` - Test suites (322 tests)

---

## 💡 Tips

### Endpoint Update Tips
1. Start with research endpoint (most critical)
2. Test each endpoint after updating
3. Check browser console for errors
4. Verify cache entries in database

### Testing Tips
1. Clear browser cache before testing
2. Watch browser console for logs
3. Check Network tab for API calls
4. Verify database entries after each test

### Debugging Tips
1. Check Vercel logs for errors
2. Verify environment variables are set
3. Check database connection
4. Verify API keys are valid

---

## 🎯 Success Criteria

### After Endpoint Updates
- ✅ All 10 endpoints use database cache
- ✅ Cache hit rate > 80%
- ✅ Response times < 1s for cached data
- ✅ No errors in console

### After Progressive Loading Update
- ✅ Session ID generated correctly
- ✅ Phase data stored in database
- ✅ Phase 4 receives context
- ✅ Analysis can resume after refresh

### After Testing
- ✅ BTC analysis completes all 4 phases
- ✅ ETH analysis completes all 4 phases
- ✅ Caching works (instant second analysis)
- ✅ Resumable analysis works
- ✅ No errors in production

---

## 📞 Need Help?

### Common Issues

**Issue**: Endpoint not caching
- Check: Is `setCachedAnalysis()` called after fetching data?
- Check: Is TTL set correctly?
- Check: Are there any errors in console?

**Issue**: Phase 4 fails
- Check: Is session ID being passed?
- Check: Is phase data being stored?
- Check: Are Phases 1-3 completing successfully?

**Issue**: Cache not persisting
- Check: Database connection working?
- Check: Expires_at timestamp set correctly?
- Check: No errors in database logs?

---

**Status**: 🟢 **READY TO START**  
**Estimated Time**: 8-10 hours  
**Priority**: HIGH  
**Next Action**: Update research endpoint first

**Let's get UCIE to 100%!** 🚀
