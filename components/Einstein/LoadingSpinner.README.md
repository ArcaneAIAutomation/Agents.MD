# Einstein LoadingSpinner Component

## Overview

The `LoadingSpinner` component provides consistent loading states across the Einstein Trade Engine. It implements Requirements 15.5 and 16.2 with Bitcoin Sovereign styling (black, orange, white).

## Features

✅ **Requirement 15.5**: Pulsing orange spinner with "Verifying Data..." text  
✅ **Requirement 16.2**: Loading spinner during refresh operations  
✅ **Progress Indicator**: Optional progress percentage display  
✅ **Multiple Sizes**: sm, md, lg, xl  
✅ **Preset States**: Pre-configured loading states for common scenarios  
✅ **Inline Support**: Compact loading states for buttons and cards  
✅ **Full Page Overlay**: Modal-style loading with interaction blocking  

## Installation

The component is already integrated into the Einstein module structure:

```
components/Einstein/
├── LoadingSpinner.tsx           # Main component
├── LoadingSpinner.example.tsx   # Usage examples
└── LoadingSpinner.README.md     # This file
```

## Basic Usage

### Simple Spinner

```tsx
import { LoadingSpinner } from '@/components/Einstein/LoadingSpinner';

<LoadingSpinner size="md" />
```

### Spinner with Text

```tsx
<LoadingSpinner
  size="lg"
  text="Loading data..."
/>
```

### Spinner with Progress

```tsx
<LoadingSpinner
  size="xl"
  text="Fetching data from APIs..."
  progress={75}
/>
```

### Pulsing Spinner

```tsx
<LoadingSpinner
  size="lg"
  text="Verifying Data..."
  pulse
/>
```

## Preset Loading States

### 1. Verifying Data (Requirement 15.5)

```tsx
import { VerifyingDataSpinner } from '@/components/Einstein/LoadingSpinner';

<VerifyingDataSpinner />
```

**Use Case**: Data refresh operations, validation processes

### 2. Generating Signal

```tsx
import { GeneratingSignalSpinner } from '@/components/Einstein/LoadingSpinner';

<GeneratingSignalSpinner />
```

**Use Case**: Trade signal generation, AI analysis

### 3. Analyzing Market

```tsx
import { AnalyzingMarketSpinner } from '@/components/Einstein/LoadingSpinner';

<AnalyzingMarketSpinner />
```

**Use Case**: Market data analysis, technical indicator calculations

### 4. Loading History

```tsx
import { LoadingHistorySpinner } from '@/components/Einstein/LoadingSpinner';

<LoadingHistorySpinner />
```

**Use Case**: Trade history loading, performance metrics

## Advanced Components

### Full Page Loading Overlay

```tsx
import { LoadingOverlay } from '@/components/Einstein/LoadingSpinner';

const [isLoading, setIsLoading] = useState(false);

<LoadingOverlay
  show={isLoading}
  text="Generating trade signal..."
  progress={50}
  disableInteractions={true}
/>
```

**Props:**
- `show`: boolean - Show/hide overlay
- `text`: string - Loading text
- `progress`: number (0-100) - Optional progress percentage
- `disableInteractions`: boolean - Disable user interactions (default: true)

### Inline Loading

```tsx
import { InlineLoading } from '@/components/Einstein/LoadingSpinner';

<InlineLoading
  text="Processing..."
  size="sm"
/>
```

**Use Case**: Buttons, list items, cards

## Props Reference

### LoadingSpinner

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Spinner size |
| `text` | `string` | - | Optional text below spinner |
| `progress` | `number` (0-100) | - | Optional progress percentage |
| `className` | `string` | `''` | Additional CSS classes |
| `pulse` | `boolean` | `false` | Enable pulsing animation |

### Size Reference

| Size | Spinner | Text | Use Case |
|------|---------|------|----------|
| `sm` | 16px | 12px | Inline, buttons |
| `md` | 24px | 14px | Cards, small sections |
| `lg` | 32px | 16px | Main content areas |
| `xl` | 48px | 18px | Full page, modals |

## Integration Examples

### 1. Refresh Button (Requirement 16.2)

```tsx
import { RefreshButton } from './RefreshButton';
import { VerifyingDataSpinner } from './LoadingSpinner';

const [isRefreshing, setIsRefreshing] = useState(false);

<button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="..."
>
  {isRefreshing ? (
    <VerifyingDataSpinner />
  ) : (
    'Refresh Data'
  )}
</button>
```

### 2. Trade Signal Generation

```tsx
import { GeneratingSignalSpinner } from './LoadingSpinner';

const [isGenerating, setIsGenerating] = useState(false);

{isGenerating ? (
  <GeneratingSignalSpinner />
) : (
  <TradeSignalDisplay signal={signal} />
)}
```

### 3. Data Quality Check

```tsx
import { LoadingSpinner } from './LoadingSpinner';

const [progress, setProgress] = useState(0);

<LoadingSpinner
  size="lg"
  text="Checking data quality..."
  progress={progress}
/>
```

### 4. Button Loading State

```tsx
import { InlineLoading } from './LoadingSpinner';

<button disabled={loading}>
  {loading ? (
    <InlineLoading text="Processing..." size="sm" />
  ) : (
    'Submit'
  )}
</button>
```

### 5. Card Loading State

```tsx
import { LoadingSpinner } from './LoadingSpinner';

<div className="bitcoin-block">
  {loading ? (
    <LoadingSpinner
      size="md"
      text="Loading trade data..."
    />
  ) : (
    <TradeData data={data} />
  )}
</div>
```

## Styling

The component uses Bitcoin Sovereign Technology design system:

- **Primary Color**: Bitcoin Orange (#F7931A)
- **Background**: Pure Black (#000000)
- **Text**: White with opacity variants
- **Animation**: Smooth spin (1s linear infinite)
- **Pulse**: Optional pulsing effect for emphasis

### Custom Styling

```tsx
<LoadingSpinner
  size="lg"
  text="Custom loading..."
  className="my-4 p-6 bg-bitcoin-orange bg-opacity-5 border border-bitcoin-orange-20 rounded-xl"
/>
```

## Accessibility

- ✅ ARIA attributes (`aria-hidden="true"` on decorative elements)
- ✅ ARIA live regions (`aria-live="polite"` on overlays)
- ✅ ARIA busy state (`aria-busy="true"` during loading)
- ✅ Screen reader friendly text
- ✅ Keyboard accessible (no focus traps)

## Performance

- **Lightweight**: Minimal DOM elements
- **GPU Accelerated**: Uses CSS transforms for animations
- **Optimized**: No unnecessary re-renders
- **Smooth**: 60fps animations

## Best Practices

### DO:

✅ Use preset components for common scenarios  
✅ Show progress when possible  
✅ Provide descriptive text  
✅ Disable interactions during loading  
✅ Use appropriate sizes for context  

### DON'T:

❌ Use multiple spinners simultaneously  
❌ Show spinner without text for long operations  
❌ Use large spinners in small spaces  
❌ Forget to disable interactions during loading  
❌ Use spinner for instant operations (<100ms)  

## Common Patterns

### Pattern 1: API Call with Progress

```tsx
const [loading, setLoading] = useState(false);
const [progress, setProgress] = useState(0);

const fetchData = async () => {
  setLoading(true);
  setProgress(0);
  
  // Simulate progress
  const steps = ['market', 'sentiment', 'onchain', 'technical'];
  for (let i = 0; i < steps.length; i++) {
    await fetchStep(steps[i]);
    setProgress(((i + 1) / steps.length) * 100);
  }
  
  setLoading(false);
};

return loading ? (
  <LoadingSpinner
    size="lg"
    text="Fetching data..."
    progress={progress}
  />
) : (
  <DataDisplay />
);
```

### Pattern 2: Button with Inline Loading

```tsx
const [submitting, setSubmitting] = useState(false);

<button
  onClick={handleSubmit}
  disabled={submitting}
  className="..."
>
  {submitting ? (
    <InlineLoading text="Submitting..." size="sm" />
  ) : (
    'Submit Trade'
  )}
</button>
```

### Pattern 3: Full Page Loading

```tsx
const [generating, setGenerating] = useState(false);
const [progress, setProgress] = useState(0);

<LoadingOverlay
  show={generating}
  text="Generating trade signal..."
  progress={progress}
/>
```

### Pattern 4: Conditional Loading

```tsx
{loading ? (
  <VerifyingDataSpinner />
) : error ? (
  <ErrorMessage error={error} />
) : (
  <Content data={data} />
)}
```

## Testing

### Manual Testing

1. Verify spinner rotates smoothly
2. Check text is readable
3. Verify progress updates correctly
4. Test pulse animation
5. Verify interactions are disabled

### Integration Testing

```typescript
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

test('displays loading text', () => {
  render(<LoadingSpinner text="Loading..." />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('shows progress percentage', () => {
  render(<LoadingSpinner progress={75} />);
  expect(screen.getByText('75%')).toBeInTheDocument();
});
```

## Troubleshooting

### Spinner Not Visible

1. Check parent container has sufficient height
2. Verify z-index is not being overridden
3. Check color contrast (orange on black)

### Animation Stuttering

1. Verify GPU acceleration is enabled
2. Check for performance bottlenecks
3. Reduce number of simultaneous animations

### Progress Not Updating

1. Verify progress prop is changing
2. Check state updates are triggering re-renders
3. Ensure progress value is between 0-100

## Examples

See `LoadingSpinner.example.tsx` for complete usage examples:

1. **Basic Spinner**: All sizes and variants
2. **Spinner with Text**: Text labels and descriptions
3. **Progress Indicator**: Animated progress display
4. **Preset States**: Pre-configured loading states
5. **Full Page Overlay**: Modal-style loading
6. **Inline Loading**: Compact loading states
7. **Refresh Button**: Integration with RefreshButton
8. **Trade Signal**: Multi-step generation process

## Related Components

- `RefreshButton` - Uses VerifyingDataSpinner
- `EinsteinGenerateButton` - Uses GeneratingSignalSpinner
- `EinsteinTradeHistory` - Uses LoadingHistorySpinner
- `DataSourceHealthPanel` - Uses LoadingSpinner

## Future Enhancements

- [ ] Skeleton loading states
- [ ] Custom animation speeds
- [ ] Multiple progress bars
- [ ] Estimated time remaining
- [ ] Cancel button support

## Support

For issues or questions:
1. Check this README
2. Review `LoadingSpinner.example.tsx`
3. Check Einstein spec: `.kiro/specs/einstein-trade-engine/`
4. Review requirements: Requirements 15.5, 16.2

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025  
**Requirements**: 15.5, 16.2
