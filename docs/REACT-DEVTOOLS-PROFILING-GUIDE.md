# React DevTools Profiling Guide for ATGE Dashboard

**Purpose**: Measure component render performance using React DevTools  
**Target**: Identify slow components and optimization opportunities

---

## Setup

### 1. Install React DevTools

#### Browser Extension (Recommended)
- **Chrome**: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- **Firefox**: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
- **Edge**: [React Developer Tools](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil)

#### Standalone App
```bash
npm install -g react-devtools
react-devtools
```

### 2. Enable Profiling in Development

The ATGE dashboard is already set up for profiling in development mode.

---

## Profiling Workflow

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Open React DevTools
1. Open browser DevTools (F12)
2. Click "Profiler" tab in React DevTools
3. You should see the React component tree

### Step 3: Record a Profile

#### Initial Load Performance
1. Click the **Record** button (⏺️) in Profiler tab
2. Navigate to `/atge` page or refresh the page
3. Wait for dashboard to fully load
4. Click **Stop** button (⏹️)

#### Filter/Sort Performance
1. Click **Record** button
2. Apply a filter (e.g., change status filter)
3. Click **Stop** button

#### Refresh Performance
1. Click **Record** button
2. Click "Refresh Stats" or "Refresh Trades" button
3. Click **Stop** button

### Step 4: Analyze Results

#### Flamegraph View
- Shows component render hierarchy
- Width = time spent rendering
- Color = render duration (green = fast, yellow = medium, red = slow)

**Look for**:
- Wide bars (slow components)
- Red/yellow bars (optimization targets)
- Repeated renders (unnecessary re-renders)

#### Ranked View
- Lists components by render time
- Sorted by total render duration

**Look for**:
- Components at the top (slowest)
- High render counts (re-rendering too often)

#### Timeline View
- Shows when components rendered
- Useful for identifying render cascades

**Look for**:
- Multiple render passes
- Render waterfalls (parent → child → grandchild)

---

## Key Metrics to Check

### 1. Component Render Time

**Target**: < 100ms per component

**Check**:
- ATGEInterface: Should be < 80ms
- PerformanceDashboard: Should be < 200ms
- TradeHistoryTable: Should be < 300ms
- TradeRow: Should be < 15ms each

**If Exceeded**:
- Consider memoization
- Check for expensive calculations
- Look for unnecessary re-renders

### 2. Render Count

**Target**: 1-2 renders per user action

**Check**:
- Initial load: 1 render per component
- Filter change: 1 render for affected components
- Refresh: 1 render for data components

**If Exceeded**:
- Check for prop changes causing re-renders
- Use React.memo() to prevent unnecessary renders
- Verify useEffect dependencies

### 3. Commit Duration

**Target**: < 16ms (60 FPS)

**Check**:
- Total commit time in Profiler
- Should be green (< 16ms) for smooth UI

**If Exceeded**:
- Optimize slow components
- Reduce DOM updates
- Consider virtualization

---

## Common Performance Issues

### Issue 1: TradeRow Re-rendering on Every Filter

**Symptom**: All TradeRow components re-render when filter changes

**Diagnosis**:
1. Record profile while changing filter
2. Check TradeRow render count
3. Should only render visible rows

**Solution**:
```typescript
// Memoize TradeRow component
const TradeRow = React.memo(({ trade, onClick }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.trade.id === nextProps.trade.id;
});
```

### Issue 2: PerformanceDashboard Slow Calculations

**Symptom**: PerformanceDashboard takes > 200ms to render

**Diagnosis**:
1. Record profile during dashboard load
2. Check PerformanceDashboard render time
3. Look for expensive calculations in render

**Solution**:
```typescript
// Memoize expensive calculations
const metrics = useMemo(() => {
  return calculateMetrics(performanceStats);
}, [performanceStats]);
```

### Issue 3: Unnecessary Re-renders on State Change

**Symptom**: Components re-render even when their props haven't changed

**Diagnosis**:
1. Record profile during state update
2. Check which components re-rendered
3. Verify if re-render was necessary

**Solution**:
```typescript
// Use React.memo() for pure components
const PureComponent = React.memo(({ data }) => {
  // Component implementation
});

// Or use useMemo for expensive renders
const expensiveComponent = useMemo(() => {
  return <ExpensiveComponent data={data} />;
}, [data]);
```

---

## Profiling Checklist

### Before Optimization
- [ ] Record initial load profile
- [ ] Record filter change profile
- [ ] Record refresh profile
- [ ] Note slowest components
- [ ] Note components with high render counts
- [ ] Take screenshots of flamegraph

### After Optimization
- [ ] Record same profiles again
- [ ] Compare render times
- [ ] Verify render counts decreased
- [ ] Check for regressions
- [ ] Document improvements

---

## Example Profiling Session

### Scenario: Optimize TradeHistoryTable Filtering

#### Step 1: Record Baseline
1. Open `/atge` page
2. Start profiling
3. Change status filter from "All" to "Active"
4. Stop profiling

**Results**:
- TradeHistoryTable: 150ms
- TradeRow (x25): 13ms each = 325ms total
- Total: 475ms

#### Step 2: Identify Issue
- All 25 TradeRow components re-rendered
- Only filtered trades should re-render
- TradeRow is not memoized

#### Step 3: Apply Optimization
```typescript
const TradeRow = React.memo(({ trade, onClick }) => {
  // Component implementation
});
```

#### Step 4: Record After Optimization
1. Refresh page
2. Start profiling
3. Change status filter from "All" to "Active"
4. Stop profiling

**Results**:
- TradeHistoryTable: 150ms
- TradeRow (x10): 13ms each = 130ms total (only active trades)
- Total: 280ms

**Improvement**: 41% faster (475ms → 280ms)

---

## Advanced Profiling

### Custom Profiler Component

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
  
  // Log to analytics
  if (actualDuration > 100) {
    console.warn(`Slow render detected: ${id} took ${actualDuration}ms`);
  }
};

// Wrap component
<Profiler id="ATGEDashboard" onRender={onRenderCallback}>
  <ATGEInterface />
</Profiler>
```

### Performance Marks

```typescript
// Mark start of operation
performance.mark('dashboard-load-start');

// Component render
// ...

// Mark end of operation
performance.mark('dashboard-load-end');

// Measure duration
performance.measure(
  'dashboard-load',
  'dashboard-load-start',
  'dashboard-load-end'
);

// Get measurement
const measure = performance.getEntriesByName('dashboard-load')[0];
console.log(`Dashboard loaded in ${measure.duration}ms`);
```

---

## Profiling Best Practices

### DO:
✅ Profile in development mode  
✅ Profile on different devices (desktop, mobile)  
✅ Profile with different data sizes (0, 10, 100 trades)  
✅ Profile user interactions (filter, sort, refresh)  
✅ Compare before/after optimization  
✅ Document findings and improvements  

### DON'T:
❌ Profile in production mode (optimizations enabled)  
❌ Profile with browser extensions enabled (can skew results)  
❌ Profile with DevTools open (adds overhead)  
❌ Make assumptions without profiling  
❌ Optimize without measuring impact  

---

## Resources

### Official Documentation
- [React Profiler API](https://react.dev/reference/react/Profiler)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools#profiler)
- [Optimizing Performance](https://react.dev/learn/render-and-commit)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Articles
- [Profiling React Performance](https://kentcdodds.com/blog/profile-a-react-app-for-performance)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)

---

**Next Steps**: 
1. Run profiling session on ATGE dashboard
2. Identify slowest components
3. Apply recommended optimizations
4. Measure improvement
5. Document results

**Related**: `ATGE-DASHBOARD-PERFORMANCE-OPTIMIZATION.md`
