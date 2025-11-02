# UCIE Mobile Optimization - Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly understand and use the UCIE mobile optimization features.

---

## 📱 Mobile Features Overview

### 1. Progressive Loading
Data loads in 4 phases for optimal mobile performance:
- **Phase 1** (< 1s): Price, volume, risk
- **Phase 2** (1-3s): News, sentiment
- **Phase 3** (3-7s): Technical, on-chain, DeFi
- **Phase 4** (7-15s): AI research, predictions

### 2. Responsive Layout
- **Desktop** (1024px+): Tab-based navigation
- **Mobile/Tablet** (< 1024px): Single-column collapsible sections

### 3. Touch Gestures
- **Swipe Left/Right**: Navigate between tabs
- **Pull Down**: Refresh data
- **Pinch**: Zoom charts

### 4. Haptic Feedback
- Vibration on button presses, selections, and actions

---

## 🔧 Quick Implementation

### Use Progressive Loading

```typescript
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';

function MyComponent({ symbol }) {
  const { phases, loading, data, refresh } = useProgressiveLoading({
    symbol,
    onPhaseComplete: (phase, data) => {
      console.log(`Phase ${phase} loaded`);
    },
  });

  if (loading) {
    return <div>Loading phase {phases.find(p => !p.complete)?.phase}...</div>;
  }

  return <div>Data: {JSON.stringify(data)}</div>;
}
```

### Detect Mobile Device

```typescript
import { useUCIEMobile } from '@/hooks/useUCIEMobile';

function MyComponent() {
  const { isMobile, isTablet, isDesktop, touchEnabled } = useUCIEMobile();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

### Add Swipe Gestures

```typescript
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

function MyComponent() {
  useSwipeGesture({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    threshold: 50,
  });

  return <div>Swipe me!</div>;
}
```

### Add Pull-to-Refresh

```typescript
import PullToRefresh from '@/components/UCIE/PullToRefresh';

function MyComponent() {
  const handleRefresh = async () => {
    await fetchNewData();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <YourContent />
    </PullToRefresh>
  );
}
```

### Add Haptic Feedback

```typescript
import { useHaptic } from '@/lib/ucie/hapticFeedback';

function MyComponent() {
  const haptic = useHaptic();

  const handleClick = () => {
    haptic.buttonPress(); // Light vibration
    // Your logic
  };

  const handleSuccess = () => {
    haptic.success(); // Success pattern
  };

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
```

### Add Lazy Loading

```typescript
import LazyLoadSection from '@/components/UCIE/LazyLoadSection';

function MyComponent() {
  return (
    <LazyLoadSection skeletonType="chart">
      <ExpensiveChart />
    </LazyLoadSection>
  );
}
```

### Monitor Performance

```typescript
import { usePerformanceMonitor } from '@/lib/ucie/performanceMonitor';

function MyComponent() {
  const monitor = usePerformanceMonitor();
  
  // Metrics logged automatically after 5 seconds
  // Check browser console for report
  
  return <div>Your content</div>;
}
```

---

## 📊 Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| FCP | < 1.8s | First Contentful Paint |
| LCP | < 2.5s | Largest Contentful Paint |
| FID | < 100ms | First Input Delay |
| CLS | < 0.1 | Cumulative Layout Shift |
| TTI | < 3s | Time to Interactive |

---

## 🎨 Mobile UI Components

### Touch-Optimized Chart

```typescript
import MobileTouchChart from '@/components/UCIE/MobileTouchChart';

<MobileTouchChart
  data={chartData}
  dataKey="price"
  xAxisKey="timestamp"
  title="Price Chart"
  color="#F7931A"
  height={300}
  showArea={true}
/>
```

### Loading Skeleton

```typescript
import MobileLoadingSkeleton from '@/components/UCIE/MobileLoadingSkeleton';

<MobileLoadingSkeleton type="chart" count={1} />
<MobileLoadingSkeleton type="card" count={3} />
<MobileLoadingSkeleton type="stat" count={4} />
<MobileLoadingSkeleton type="list" count={1} />
```

---

## 🔍 Debugging

### Check Device Capabilities

```typescript
const capabilities = useUCIEMobile();
console.log('Device:', capabilities);
// {
//   isMobile: true,
//   touchEnabled: true,
//   connectionType: '4g',
//   ...
// }
```

### Check Performance Metrics

```typescript
import { getPerformanceMonitor } from '@/lib/ucie/performanceMonitor';

const monitor = getPerformanceMonitor();
monitor.logMetrics(); // Logs to console
```

### Analyze Bundle Size

```typescript
import { analyzeBundleSize } from '@/lib/ucie/performanceMonitor';

analyzeBundleSize(); // Logs JS, CSS, images sizes
```

---

## 🎯 Best Practices

### 1. Always Use Progressive Loading
```typescript
// ✅ Good
const { data, loading } = useProgressiveLoading({ symbol });

// ❌ Bad
const data = await fetch('/api/all-data'); // Blocks everything
```

### 2. Detect Mobile Before Rendering
```typescript
// ✅ Good
const { isMobile } = useUCIEMobile();
return isMobile ? <MobileView /> : <DesktopView />;

// ❌ Bad
return <div className="hidden md:block">...</div>; // Still renders
```

### 3. Add Haptic Feedback to Actions
```typescript
// ✅ Good
const handleClick = () => {
  haptic.buttonPress();
  doAction();
};

// ❌ Bad
const handleClick = () => {
  doAction(); // No feedback
};
```

### 4. Lazy Load Below-Fold Content
```typescript
// ✅ Good
<LazyLoadSection>
  <ExpensiveComponent />
</LazyLoadSection>

// ❌ Bad
<ExpensiveComponent /> // Loads immediately
```

### 5. Monitor Performance
```typescript
// ✅ Good
usePerformanceMonitor(); // Tracks metrics

// ❌ Bad
// No monitoring
```

---

## 🐛 Common Issues

### Issue: Swipe not working
**Solution**: Check if device has touch support
```typescript
const { touchEnabled } = useUCIEMobile();
if (!touchEnabled) {
  console.log('Touch not supported');
}
```

### Issue: Haptic not working
**Solution**: Requires HTTPS and user permission
```typescript
import { isHapticSupported } from '@/lib/ucie/hapticFeedback';
if (!isHapticSupported()) {
  console.log('Haptic not supported');
}
```

### Issue: Progressive loading stuck
**Solution**: Check API endpoints
```typescript
const { phases } = useProgressiveLoading({ symbol });
phases.forEach(phase => {
  if (phase.error) {
    console.error(`Phase ${phase.phase} error:`, phase.error);
  }
});
```

---

## 📚 API Reference

### useProgressiveLoading

```typescript
const {
  phases,        // Array of loading phases
  loading,       // Overall loading state
  currentPhase,  // Current phase number (1-4)
  overallProgress, // Overall progress (0-100)
  data,          // Aggregated data
  refresh,       // Function to refresh all data
} = useProgressiveLoading({
  symbol: 'BTC',
  onPhaseComplete: (phase, data) => {},
  onAllComplete: (allData) => {},
  onError: (phase, error) => {},
});
```

### useUCIEMobile

```typescript
const {
  isMobile,              // < 768px
  isTablet,              // 768px - 1024px
  isDesktop,             // >= 1024px
  screenWidth,           // Current width
  screenHeight,          // Current height
  touchEnabled,          // Touch support
  connectionType,        // Network type
  prefersReducedMotion,  // Accessibility
  devicePixelRatio,      // Screen density
  isLowPowerMode,        // Battery status
} = useUCIEMobile();
```

### useSwipeGesture

```typescript
const { isSwiping } = useSwipeGesture({
  onSwipeLeft: () => {},
  onSwipeRight: () => {},
  onSwipeUp: () => {},
  onSwipeDown: () => {},
  threshold: 50,           // Min distance (px)
  velocityThreshold: 0.3,  // Min velocity (px/ms)
});
```

### useHaptic

```typescript
const {
  isSupported,   // Haptic support
  trigger,       // Trigger custom haptic
  buttonPress,   // Light tap
  success,       // Success pattern
  error,         // Error pattern
  warning,       // Warning pattern
  selection,     // Selection change
  swipe,         // Swipe gesture
  refresh,       // Refresh action
} = useHaptic();
```

---

## 🎓 Learn More

- **Full Documentation**: `UCIE-MOBILE-OPTIMIZATION-COMPLETE.md`
- **Spec**: `.kiro/specs/universal-crypto-intelligence/`
- **Steering**: `.kiro/steering/mobile-development.md`

---

## ✅ Checklist

Before deploying mobile features:

- [ ] Test on iPhone (375px, 390px, 428px)
- [ ] Test on iPad (768px, 1024px)
- [ ] Test on Android (360px, 412px)
- [ ] Verify progressive loading (4 phases)
- [ ] Test swipe gestures
- [ ] Test pull-to-refresh
- [ ] Verify haptic feedback
- [ ] Check performance metrics
- [ ] Test lazy loading
- [ ] Verify touch targets (48px min)
- [ ] Test collapsible sections
- [ ] Check responsive layouts

---

**Happy Mobile Development!** 🚀📱

For questions or issues, check the full documentation or create an issue in the project repository.
