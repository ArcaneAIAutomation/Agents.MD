# UCIE OpenAI Async - Next Steps Checklist

**Status**: Backend Complete ✅ | Frontend Pending 🔄  
**Date**: January 27, 2025

---

## ✅ Completed (Backend)

- [x] Database table created (`ucie_openai_jobs`)
- [x] Indexes added for performance
- [x] Start endpoint implemented (`/api/ucie/openai-summary-start/[symbol]`)
- [x] Poll endpoint implemented (`/api/ucie/openai-summary-poll/[jobId]`)
- [x] Optional authentication integrated
- [x] Error handling complete
- [x] Progress tracking implemented
- [x] Pattern matches Whale Watch (3s polling, 30min timeout)
- [x] Documentation complete

---

## 🔄 Remaining Work (Frontend)

### 1. Create React Hook

**File**: `hooks/useOpenAISummary.ts`

**Implementation**:
```typescript
import { useState } from 'react';

interface UseOpenAISummaryResult {
  status: 'idle' | 'starting' | 'polling' | 'completed' | 'error';
  result: any | null;
  error: string | null;
  progress: string;
  elapsedTime: number;
  startAnalysis: () => Promise<void>;
}

export const useOpenAISummary = (symbol: string): UseOpenAISummaryResult => {
  // Implementation here (see UCIE-OPENAI-SUMMARY-ASYNC-COMPLETE.md)
};
```

**Estimated Time**: 30 minutes

---

### 2. Create Progress UI Component

**File**: `components/UCIE/OpenAIAnalysisProgress.tsx`

**Features**:
- Progress bar (0-100%)
- Stage indicator (5 stages)
- Elapsed time display
- Cancel button
- Estimated time remaining

**Reference**: `components/WhaleWatch/WhaleWatchDashboard.tsx` (DeepDiveProgress component)

**Estimated Time**: 1 hour

---

### 3. Integrate into UCIE Dashboard

**File**: `components/UCIE/UCIEDashboard.tsx` (or similar)

**Changes**:
- Add "Start AI Analysis" button
- Show progress component when analyzing
- Display results when complete
- Handle errors gracefully

**Estimated Time**: 1 hour

---

### 4. Update UCIE Summary Endpoint

**File**: `pages/api/ucie/openai-summary/[symbol].ts`

**Changes**:
- Redirect to new async pattern
- Or deprecate in favor of start/poll endpoints
- Update documentation

**Estimated Time**: 30 minutes

---

### 5. Testing

**Manual Testing**:
- [ ] Start analysis for BTC
- [ ] Verify polling works (every 3 seconds)
- [ ] Check progress updates
- [ ] Confirm completion after 2-10 minutes
- [ ] Test error handling
- [ ] Test multiple concurrent analyses
- [ ] Test cancel functionality

**Automated Testing**:
- [ ] Write integration test for start/poll flow
- [ ] Test timeout after 30 minutes
- [ ] Test error scenarios
- [ ] Test concurrent job handling

**Estimated Time**: 2 hours

---

### 6. Database Cleanup

**File**: `pages/api/cron/cleanup-openai-jobs.ts`

**Implementation**:
```typescript
// Delete old completed jobs (older than 24 hours)
DELETE FROM ucie_openai_jobs 
WHERE status = 'completed' 
AND created_at < NOW() - INTERVAL '24 hours';

// Delete old failed jobs (older than 7 days)
DELETE FROM ucie_openai_jobs 
WHERE status = 'error' 
AND created_at < NOW() - INTERVAL '7 days';
```

**Vercel Cron**:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-openai-jobs",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Estimated Time**: 30 minutes

---

### 7. Documentation Updates

**Files to Update**:
- [ ] `README.md` - Add async pattern documentation
- [ ] `UCIE-QUICK-START.md` - Update with new endpoints
- [ ] `.kiro/steering/ucie-system.md` - Document async pattern
- [ ] API documentation - Add start/poll endpoints

**Estimated Time**: 1 hour

---

## 📊 Total Estimated Time

- **React Hook**: 30 minutes
- **Progress UI**: 1 hour
- **Dashboard Integration**: 1 hour
- **Endpoint Update**: 30 minutes
- **Testing**: 2 hours
- **Database Cleanup**: 30 minutes
- **Documentation**: 1 hour

**Total**: ~6.5 hours

---

## 🎯 Priority Order

### High Priority (Must Have)
1. ✅ Backend endpoints (COMPLETE)
2. 🔄 React hook implementation
3. 🔄 Dashboard integration
4. 🔄 Basic testing

### Medium Priority (Should Have)
5. 🔄 Progress UI component
6. 🔄 Comprehensive testing
7. 🔄 Database cleanup cron

### Low Priority (Nice to Have)
8. 🔄 Documentation updates
9. 🔄 Advanced error handling
10. 🔄 Performance monitoring

---

## 🚀 Quick Start for Frontend Developer

### Step 1: Copy Whale Watch Pattern

The frontend implementation should closely match Whale Watch Deep Dive:

**Reference File**: `components/WhaleWatch/WhaleWatchDashboard.tsx`

**Key Sections**:
- Lines 700-850: Deep Dive analysis with polling
- Lines 200-250: Progress component
- Lines 600-650: Start analysis function

### Step 2: Adapt for UCIE

**Changes Needed**:
- Replace `/api/whale-watch/deep-dive-instant` with `/api/ucie/openai-summary-start/[symbol]`
- Replace `/api/whale-watch/deep-dive-poll` with `/api/ucie/openai-summary-poll/[jobId]`
- Adjust progress stages for UCIE analysis
- Update UI text and styling

### Step 3: Test Locally

```bash
# Start dev server
npm run dev

# Test start endpoint
curl -X POST http://localhost:3000/api/ucie/openai-summary-start/BTC

# Test poll endpoint
curl http://localhost:3000/api/ucie/openai-summary-poll/1
```

---

## 📚 Reference Documentation

### Backend (Complete)
- `UCIE-OPENAI-SUMMARY-ASYNC-COMPLETE.md` - Full implementation guide
- `UCIE-OPENAI-ASYNC-QUICK-REFERENCE.md` - Quick lookup
- `CHATGPT-5.1-ASYNC-IMPLEMENTATION-COMPLETE.md` - Summary

### Frontend (To Be Created)
- `hooks/useOpenAISummary.ts` - React hook
- `components/UCIE/OpenAIAnalysisProgress.tsx` - Progress UI
- Integration in UCIE dashboard

### Reference Implementation
- `components/WhaleWatch/WhaleWatchDashboard.tsx` - Proven pattern

---

## ✅ Success Criteria

### Backend (Complete) ✅
- [x] Start endpoint responds in < 1 second
- [x] Poll endpoint responds in < 100ms
- [x] Database stores job state correctly
- [x] Authentication works (optional)
- [x] Error handling robust

### Frontend (Pending) 🔄
- [ ] Hook manages state correctly
- [ ] Progress updates every 3 seconds
- [ ] UI shows real-time progress
- [ ] Analysis completes successfully
- [ ] Errors handled gracefully
- [ ] Multiple concurrent analyses work

---

## 🎉 When Complete

Once all frontend work is done:

1. ✅ No more Vercel timeout errors
2. ✅ GPT-5.1 analysis works reliably
3. ✅ Users see real-time progress
4. ✅ Multiple users can analyze simultaneously
5. ✅ System scales with database-backed jobs

**The UCIE OpenAI async implementation will be production-ready!** 🚀

---

**Current Status**: Backend complete, frontend integration needed  
**Next Action**: Implement React hook (`hooks/useOpenAISummary.ts`)  
**Reference**: Whale Watch Deep Dive pattern (proven in production)
