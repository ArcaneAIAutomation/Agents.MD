# UCIE UX & Accessibility - Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly integrate the UX and accessibility features into your UCIE components.

---

## 📦 What's Included

### Components (9 files)
- `Tooltip.tsx` - Universal tooltip component
- `HelpButton.tsx` - Standardized help icon
- `InteractiveTutorial.tsx` - First-time user onboarding
- `BeginnerModeToggle.tsx` - Mode switcher
- `SimplifiedAnalysisView.tsx` - Beginner interface
- `AccessiblePanel.tsx` - Accessible containers
- `VisualIndicators.tsx` - Visual feedback components
- `NotificationToast.tsx` - User notifications

### Libraries (2 files)
- `helpContent.ts` - 40+ metric explanations
- `accessibility.ts` - Accessibility utilities

### Styles
- `globals.css` - Accessibility and animation styles

---

## 🎯 Quick Integration

### 1. Add Help to Any Metric

```tsx
import HelpButton from './components/UCIE/HelpButton';

<div className="flex items-center gap-2">
  <span>RSI (Relative Strength Index)</span>
  <HelpButton metricKey="rsi" size="sm" />
</div>
```

### 2. Add Interactive Tutorial

```tsx
import InteractiveTutorial, { useTutorial } from './components/UCIE/InteractiveTutorial';

function MyApp() {
  const { showTutorial, setShowTutorial } = useTutorial();
  
  return (
    <>
      {showTutorial && (
        <InteractiveTutorial
          onComplete={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}
      {/* Your app content */}
    </>
  );
}
```

### 3. Add Beginner Mode

```tsx
import BeginnerModeToggle, { useBeginnerMode } from './components/UCIE/BeginnerModeToggle';
import SimplifiedAnalysisView from './components/UCIE/SimplifiedAnalysisView';

function Analysis() {
  const { isBeginnerMode } = useBeginnerMode();
  
  return (
    <>
      <BeginnerModeToggle />
      
      {isBeginnerMode ? (
        <SimplifiedAnalysisView {...props} />
      ) : (
        <AdvancedAnalysisView {...props} />
      )}
    </>
  );
}
```

### 4. Add Notifications

```tsx
import { useNotifications, NotificationContainer } from './components/UCIE/NotificationToast';

function MyComponent() {
  const { notifications, success, error, removeNotification } = useNotifications();
  
  // Show notification
  const handleAnalysisComplete = () => {
    success('Analysis Complete', 'Your analysis is ready to view', 5000);
  };
  
  return (
    <>
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        position="top-right"
      />
      {/* Your component */}
    </>
  );
}
```

### 5. Add Visual Indicators

```tsx
import { 
  SignalIndicator, 
  ConfidenceIndicator,
  ProgressIndicator,
  LiveIndicator
} from './components/UCIE/VisualIndicators';

<SignalIndicator signal="bullish" strength={85} />
<ConfidenceIndicator score={92} label="Confidence" />
<ProgressIndicator progress={65} label="Analyzing..." />
<LiveIndicator label="Live" />
```

### 6. Make Panels Accessible

```tsx
import AccessiblePanel from './components/UCIE/AccessiblePanel';

<AccessiblePanel
  id="technical-analysis"
  title="Technical Analysis"
  ariaDescription="15+ technical indicators with AI interpretation"
  isCollapsible={true}
  defaultExpanded={true}
>
  {/* Panel content */}
</AccessiblePanel>
```

---

## 📝 Adding New Help Content

Edit `lib/ucie/helpContent.ts`:

```tsx
export const helpContent: Record<string, HelpContent> = {
  // ... existing content
  
  myNewMetric: {
    title: 'My New Metric',
    description: 'Plain-language explanation of what this metric means and how to interpret it.',
    learnMoreUrl: 'https://example.com/learn-more' // Optional
  }
};
```

Then use it:

```tsx
<HelpButton metricKey="myNewMetric" />
```

---

## 🎨 Using Visual Indicators

### Signal Indicators

```tsx
// Bullish signal
<SignalIndicator signal="bullish" strength={85} label="Strong Buy" />

// Bearish signal
<SignalIndicator signal="bearish" strength={70} label="Sell" />

// Neutral signal
<SignalIndicator signal="neutral" label="Hold" />
```

### Confidence Scores

```tsx
<ConfidenceIndicator 
  score={92} 
  label="Analysis Confidence"
  showBar={true}
/>
```

### Loading States

```tsx
import { Skeleton } from './components/UCIE/VisualIndicators';

// While loading
<Skeleton width="200px" height="20px" variant="text" />
<Skeleton width="100px" height="100px" variant="circular" />
```

### Progress Tracking

```tsx
<ProgressIndicator
  progress={65}
  label="Analyzing data"
  showPercentage={true}
  phases={['Market Data', 'Technical Analysis', 'AI Processing']}
  currentPhase={1}
/>
```

---

## ♿ Accessibility Checklist

When creating new components:

- [ ] Add ARIA labels to icon-only buttons
- [ ] Use semantic HTML (section, nav, main, etc.)
- [ ] Ensure 48px minimum touch targets
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Check color contrast (4.5:1 minimum)
- [ ] Add focus indicators
- [ ] Test with screen reader
- [ ] Support reduced motion preference

---

## 🎯 Common Patterns

### Pattern 1: Metric with Help

```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <span className="text-sm text-bitcoin-white-60">RSI</span>
    <HelpButton metricKey="rsi" size="sm" />
  </div>
  <span className="font-mono text-lg font-bold text-bitcoin-white">
    65.4
  </span>
</div>
```

### Pattern 2: Collapsible Section

```tsx
<AccessiblePanel
  id="on-chain-analytics"
  title="On-Chain Analytics"
  ariaDescription="Blockchain data and whale movements"
  isCollapsible={true}
  defaultExpanded={false}
>
  {/* Content loads only when expanded */}
</AccessiblePanel>
```

### Pattern 3: Loading State

```tsx
{loading ? (
  <div className="space-y-3">
    <Skeleton width="100%" height="20px" />
    <Skeleton width="80%" height="20px" />
    <Skeleton width="60%" height="20px" />
  </div>
) : (
  <div>{data}</div>
)}
```

### Pattern 4: Success/Error Feedback

```tsx
const { success, error } = useNotifications();

try {
  await fetchData();
  success('Success', 'Data loaded successfully');
} catch (err) {
  error('Error', 'Failed to load data. Please try again.');
}
```

---

## 🔧 Customization

### Custom Tooltip Position

```tsx
<Tooltip content="Explanation" position="bottom">
  <span>Hover me</span>
</Tooltip>
```

### Custom Notification Duration

```tsx
// Show for 10 seconds
success('Title', 'Message', 10000);

// Show until manually closed
success('Title', 'Message', 0);
```

### Custom Progress Phases

```tsx
<ProgressIndicator
  progress={progress}
  phases={['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']}
  currentPhase={currentPhase}
/>
```

---

## 📱 Mobile Considerations

All components are mobile-optimized:

- **Tooltips**: Click on mobile, hover on desktop
- **Touch targets**: 48px minimum
- **Tutorial**: Responsive positioning
- **Notifications**: Stack properly on mobile
- **Panels**: Collapsible for space efficiency

---

## 🎨 Bitcoin Sovereign Styling

All components follow the design system:

- **Colors**: Black (#000000), Orange (#F7931A), White (#FFFFFF)
- **Borders**: Thin orange borders (1-2px)
- **Glow**: Orange glow effects for emphasis
- **Typography**: Inter for UI, Roboto Mono for data
- **Contrast**: WCAG AA compliant (4.5:1 minimum)

---

## 🐛 Troubleshooting

### Help content not showing?
- Check that the metric key exists in `helpContent.ts`
- Verify the import path is correct

### Tutorial not appearing?
- Clear localStorage: `localStorage.removeItem('ucie_tutorial_completed')`
- Check that the tutorial component is rendered

### Notifications not visible?
- Ensure `NotificationContainer` is rendered
- Check z-index conflicts (notifications use z-10000)

### Focus indicators not showing?
- Check that `:focus-visible` styles are not overridden
- Verify `globals.css` is imported

---

## 📚 Full Documentation

For complete documentation, see:
- `components/UCIE/UX_ACCESSIBILITY_README.md` - Comprehensive guide
- `UCIE-UX-ACCESSIBILITY-COMPLETE.md` - Implementation summary

---

## ✅ Next Steps

1. **Add help buttons** to all metric labels
2. **Implement tutorial** for first-time users
3. **Add beginner mode toggle** to header
4. **Use visual indicators** throughout
5. **Add notification system** for feedback
6. **Test accessibility** with keyboard and screen reader
7. **Validate color contrast** with automated tools

---

**Status**: ✅ Ready to use
**Support**: See full documentation for detailed examples
**Questions**: Check `UX_ACCESSIBILITY_README.md`
