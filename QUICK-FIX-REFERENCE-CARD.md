# UCIE Data Rendering Issue - Quick Fix Reference Card

**Status**: 🔍 **READY FOR BROWSER TESTING**  
**Date**: November 28, 2025

---

## 🎯 The Problem (In 30 Seconds)

**What's broken**: Data Preview Modal shows X icons instead of checkmarks  
**What we know**: Backend works perfectly, data is fetched correctly  
**What we need**: Browser console logs to identify exact break point  

---

## 🚀 Quick Test (2 Minutes)

### 1. Open Browser
```
http://localhost:3000
```

### 2. Open Console
```
Press F12 → Console tab → Clear (Ctrl+L)
```

### 3. Click BTC Button
```
Watch logs appear in real-time
```

### 4. Look For This

**✅ GOOD** - If you see:
```
🔍 API STATUS STRUCTURE: {
  working: ['Market Data', 'Sentiment', 'Technical', 'News', 'On-Chain']
}
```

**❌ BAD** - If you see:
```
🔍 DataSourceExpander RECEIVED PROPS: {
  apiStatusWorking: []  ← Empty!
}
```

---

## 📋 What To Share

**Copy and paste these logs**:
1. `🔍 RAW API RESPONSE:`
2. `🔍 API STATUS STRUCTURE:`
3. `🔍 PREVIEW STATE SET:`
4. `🔍 DataSourceExpander RECEIVED PROPS:`
5. `🔍 DATA SOURCES STATUS CHECK:`

**Plus**:
- Screenshot of UI (showing X icons)
- Any error messages

---

## 🔧 Likely Fixes (Based on Logs)

### Scenario A: Empty `apiStatusWorking` Array
**Root Cause**: State not updating before render  
**Fix**: Add null check before rendering DataSourceExpander
```typescript
{preview?.collectedData && preview?.apiStatus && (
  <DataSourceExpander ... />
)}
```

### Scenario B: `working: false` in Status Check
**Root Cause**: Array comparison failing  
**Fix**: Ensure array values match exactly (case, spelling)

### Scenario C: `hasData: false` in Status Check
**Root Cause**: Data structure mismatch  
**Fix**: Update hasData logic to check correct path

---

## ⏱️ Timeline

**After you share logs**:
- 5 min: Analyze logs
- 5 min: Identify root cause
- 10 min: Implement fix
- 10 min: Test and verify

**Total**: ~30 minutes to complete fix

---

## 📚 Full Documentation

- **Investigation Details**: `UCIE-DATA-RENDERING-RACE-CONDITION-FIX.md`
- **Testing Instructions**: `scripts/test-frontend-logging.md`
- **Executive Summary**: `UCIE-RACE-CONDITION-INVESTIGATION-SUMMARY.md`

---

## ✅ Success Criteria

**Fix works when**:
- ✅ Green checkmarks (not X icons)
- ✅ Sections clickable (not greyed out)
- ✅ Data expands when clicked
- ✅ Works every time

---

**Ready?** Open browser, click BTC, share logs! 🚀

