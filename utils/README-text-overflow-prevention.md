# Text Overflow Prevention System

Comprehensive utilities and components for detecting and preventing text overflow issues in the Crypto Herald platform.

## Overview

This system provides:
- **CSS Containment Strategies**: Pre-built CSS classes for common overflow scenarios
- **React Components**: Safe container components that prevent overflow
- **Detection Utilities**: Tools to detect overflow issues in development
- **Auto-Fix Capabilities**: Automatic overflow resolution
- **Development Monitoring**: Continuous overflow detection during development

## Quick Start

### 1. Using CSS Classes

Apply overflow prevention classes directly to your elements:

```tsx
// Single-line text with ellipsis
<div className="text-overflow-ellipsis">
  Long text that will be truncated with...
</div>

// Multi-line text with word breaking
<div className="text-overflow-break">
  Long text that will wrap and break words if needed
</div>

// Safe container for any content
<div className="safe-container">
  Content that won't overflow
</div>
```

### 2. Using React Components

Import and use safe container components:

```tsx
import {
  SafeContainer,
  SafePrice,
  SafeAmount,
  TruncatedText,
} from '../components/SafeContainer';

function MyComponent() {
  return (
    <SafeContainer>
      <SafePrice>${price}</SafePrice>
      <SafeAmount>{amount} BTC</SafeAmount>
      <TruncatedText lines={2}>
        Long description text...
      </TruncatedText>
    </SafeContainer>
  );
}
```

### 3. Using Development Detection

Enable overflow detection in development mode:

```tsx
import { useOverflowDetection } from '../hooks/useOverflowDetection';

function App() {
  const { overflowElements, scan } = useOverflowDetection({
    enabled: true,
    autoScan: true,
    highlightElements: true,
  });

  return (
    <div>
      {overflowElements.length > 0 && (
        <div className="dev-warning">
          ⚠️ {overflowElements.length} overflow issues detected
        </div>
      )}
      {/* Your app content */}
    </div>
  );
}
```

## CSS Classes Reference

### Containment Strategies

| Class | Description | Use Case |
|-------|-------------|----------|
| `text-overflow-ellipsis` | Single-line with ellipsis | Titles, labels, single-line text |
| `text-overflow-break` | Multi-line with word breaking | Paragraphs, descriptions |
| `text-overflow-anywhere` | Break anywhere (including URLs) | Crypto addresses, long URLs |
| `text-overflow-scroll` | Horizontal scroll | Tables, wide content |
| `text-overflow-safe` | Safe default | General containers |

### Word Break Utilities

| Class | Description |
|-------|-------------|
| `word-break-normal` | Normal word breaking |
| `word-break-words` | Break words if needed |
| `word-break-all` | Break anywhere |
| `word-break-keep` | Keep words together |

### Overflow Wrap Utilities

| Class | Description |
|-------|-------------|
| `overflow-wrap-normal` | Normal wrapping |
| `overflow-wrap-break` | Break words if needed |
| `overflow-wrap-anywhere` | Break anywhere |

### Container Utilities

| Class | Description |
|-------|-------------|
| `safe-container` | General safe container |
| `safe-flex-child` | Safe flex child |
| `safe-grid-child` | Safe grid child |
| `mobile-safe-container` | Mobile-only safe container |

### Text Truncation

| Class | Description |
|-------|-------------|
| `truncate-1-line` | Truncate to 1 line |
| `truncate-2-lines` | Truncate to 2 lines |
| `truncate-3-lines` | Truncate to 3 lines |

## React Components Reference

### SafeContainer

General purpose safe container with configurable strategies.

```tsx
<SafeContainer strategy="ellipsis">
  Content
</SafeContainer>
```

**Props:**
- `strategy`: 'ellipsis' | 'break' | 'anywhere' | 'scroll' | 'safe'
- `as`: HTML element type (default: 'div')
- `className`: Additional CSS classes

### SafeFlexContainer / SafeFlexChild

Prevent overflow in flex layouts.

```tsx
<SafeFlexContainer>
  <SafeFlexChild>Item 1</SafeFlexChild>
  <SafeFlexChild>Item 2</SafeFlexChild>
</SafeFlexContainer>
```

### SafeGridContainer / SafeGridChild

Prevent overflow in grid layouts.

```tsx
<SafeGridContainer>
  <SafeGridChild>Cell 1</SafeGridChild>
  <SafeGridChild>Cell 2</SafeGridChild>
</SafeGridContainer>
```

### TruncatedText

Text with line clamping.

```tsx
<TruncatedText lines={2}>
  Long text that will be truncated to 2 lines...
</TruncatedText>
```

### Specialized Components

```tsx
// Price displays
<SafePrice>${price}</SafePrice>

// Amount displays
<SafeAmount>{amount} BTC</SafeAmount>

// Percentage displays
<SafePercentage>{change}%</SafePercentage>

// Badges
<SafeBadge>Label</SafeBadge>

// Status messages
<SafeStatusMessage>Status text</SafeStatusMessage>
```

## Detection Utilities

### scanForOverflow

Scan DOM for overflow issues.

```typescript
import { scanForOverflow } from '../utils/textOverflowPrevention';

const results = scanForOverflow(document.body, {
  logToConsole: true,
  highlightElements: true,
});

console.log(`Found ${results.length} overflow issues`);
```

### detectOverflow

Check if a specific element has overflow.

```typescript
import { detectOverflow } from '../utils/textOverflowPrevention';

const element = document.getElementById('my-element');
const result = detectOverflow(element);

if (result.hasOverflow) {
  console.log('Overflow detected:', result);
}
```

### autoFixOverflow

Automatically fix overflow issues.

```typescript
import { autoFixOverflow } from '../utils/textOverflowPrevention';

const element = document.getElementById('my-element');
autoFixOverflow(element, 'safeDefault');
```

## React Hooks

### useOverflowDetection

Main hook for overflow detection.

```tsx
const {
  overflowElements,
  scan,
  clearHighlights,
  fixOverflow,
  startMonitoring,
  stopMonitoring,
  isMonitoring,
} = useOverflowDetection({
  enabled: true,
  autoScan: true,
  scanDelay: 1000,
  highlightElements: true,
  logToConsole: true,
  autoFix: false,
  continuousMonitoring: false,
});
```

### useElementOverflow

Check overflow for a specific element.

```tsx
const ref = useRef<HTMLDivElement>(null);
const { hasOverflow, overflowX, overflowY } = useElementOverflow(ref);

return (
  <div ref={ref}>
    {hasOverflow && <p>Overflow detected!</p>}
  </div>
);
```

### useOverflowWarning

Show console warnings for overflow.

```tsx
const ref = useRef<HTMLDivElement>(null);
useOverflowWarning(ref, 'MyComponent');

return <div ref={ref}>Content</div>;
```

## Development Monitoring

### OverflowMonitor

Continuous overflow monitoring in development.

```typescript
import { overflowMonitor } from '../utils/textOverflowPrevention';

// Start monitoring
overflowMonitor.start(5000); // Check every 5 seconds

// Stop monitoring
overflowMonitor.stop();

// Check if active
if (overflowMonitor.isActive()) {
  console.log('Monitoring active');
}
```

## Mobile-Specific Features

### Automatic Mobile Overflow Prevention

On mobile devices (< 768px), the following elements automatically get overflow prevention:

- Zone cards and prices
- Whale watch cards and amounts
- Badges and labels
- Price and number displays
- Status messages
- Flex and grid containers

### Mobile-Only Classes

```tsx
// Only applies overflow prevention on mobile
<div className="mobile-safe-container">
  Content
</div>
```

## Best Practices

### 1. Use Appropriate Strategies

```tsx
// ✅ Good: Single-line titles with ellipsis
<h2 className="text-overflow-ellipsis">
  {title}
</h2>

// ✅ Good: Multi-line descriptions with word breaking
<p className="text-overflow-break">
  {description}
</p>

// ✅ Good: Crypto addresses with anywhere breaking
<code className="text-overflow-anywhere">
  {walletAddress}
</code>
```

### 2. Apply to Flex/Grid Children

```tsx
// ✅ Good: Prevent flex child overflow
<div className="flex">
  <div className="safe-flex-child">
    Content that won't overflow
  </div>
</div>

// ❌ Bad: No overflow prevention
<div className="flex">
  <div>
    Content might overflow
  </div>
</div>
```

### 3. Use Safe Components for Complex Layouts

```tsx
// ✅ Good: Use safe components
<SafeFlexContainer>
  <SafeFlexChild>
    <SafePrice>${price}</SafePrice>
  </SafeFlexChild>
</SafeFlexContainer>

// ❌ Bad: Manual overflow handling
<div style={{ overflow: 'hidden' }}>
  <div style={{ minWidth: 0 }}>
    ${price}
  </div>
</div>
```

### 4. Enable Detection in Development

```tsx
// ✅ Good: Enable in development
function App() {
  useOverflowDetection({
    enabled: process.env.NODE_ENV === 'development',
    autoScan: true,
    highlightElements: true,
  });

  return <YourApp />;
}
```

## Common Issues and Solutions

### Issue: Text Overflowing in Flex Container

**Solution:** Add `min-width: 0` to flex children

```tsx
<div className="flex">
  <div className="safe-flex-child">
    Content
  </div>
</div>
```

### Issue: Long URLs Breaking Layout

**Solution:** Use `text-overflow-anywhere`

```tsx
<a className="text-overflow-anywhere" href={url}>
  {url}
</a>
```

### Issue: Price Numbers Overflowing

**Solution:** Use `SafePrice` component

```tsx
<SafePrice>${price.toFixed(2)}</SafePrice>
```

### Issue: Badge Text Too Long

**Solution:** Use `text-overflow-ellipsis`

```tsx
<span className="badge text-overflow-ellipsis">
  {longLabel}
</span>
```

## Testing

### Manual Testing

1. Enable overflow detection:
```tsx
useOverflowDetection({ enabled: true, highlightElements: true });
```

2. Check console for warnings
3. Look for red outlines on elements
4. Test at different screen sizes (320px, 375px, 390px, 428px, 768px)

### Automated Testing

```typescript
import { scanForOverflow } from '../utils/textOverflowPrevention';

// In your test
const results = scanForOverflow(document.body);
expect(results.length).toBe(0); // No overflow issues
```

## Performance Considerations

- CSS classes have minimal performance impact
- Detection utilities should only run in development
- Continuous monitoring uses intervals (configurable)
- Auto-fix applies CSS changes (no re-renders)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- CSS containment strategies use standard CSS
- No polyfills required

## Related Documentation

- [Mobile Development Guidelines](../mobile-development.md)
- [Accessibility Testing](./README-accessibility-testing.md)
- [Container Queries](./README-container-queries.md)

## Support

For issues or questions:
1. Check console warnings in development mode
2. Use overflow detection tools to identify issues
3. Apply appropriate CSS classes or components
4. Test across different screen sizes
