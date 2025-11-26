# DataChangeIndicator Component

## Overview

The `DataChangeIndicator` component provides visual feedback when data values change in the Einstein Trade Engine. It highlights changed data with an orange glow effect and displays an "Updated" badge that automatically fades after 3 seconds.

## Features

- ✅ **Orange Glow Effect**: Highlights changed values with Bitcoin Sovereign orange glow
- ✅ **"Updated" Badge**: Shows a prominent badge when data changes
- ✅ **Auto-Fade**: Animations automatically fade after configurable duration (default: 3 seconds)
- ✅ **Smooth Transitions**: CSS animations optimized for performance
- ✅ **Mobile Optimized**: Reduced animation intensity on mobile devices
- ✅ **Accessibility**: Respects `prefers-reduced-motion` user preference
- ✅ **High Contrast Support**: Enhanced visibility in high contrast mode

## Requirements

**Validates**: Requirements 13.3 (Data change detection and visual feedback)

## Installation

The component is located at `components/Einstein/DataChangeIndicator.tsx` and requires the animation styles in `styles/globals.css`.

## Basic Usage

### Single Value Change Detection

```tsx
import DataChangeIndicator from '@/components/Einstein/DataChangeIndicator';

function PriceDisplay() {
  const [price, setPrice] = useState(95000);
  const [previousPrice, setPreviousPrice] = useState<number | undefined>(undefined);

  // Update price and track previous value
  const updatePrice = (newPrice: number) => {
    setPreviousPrice(price);
    setPrice(newPrice);
  };

  return (
    <DataChangeIndicator
      value={price}
      previousValue={previousPrice}
      showBadge={true}
      glowDuration={3000}
    >
      <div className="stat-card">
        <div className="stat-label">Bitcoin Price</div>
        <div className="stat-value-orange">
          ${price.toLocaleString()}
        </div>
      </div>
    </DataChangeIndicator>
  );
}
```

### Multiple Values with Individual Tracking

```tsx
import DataChangeIndicator from '@/components/Einstein/DataChangeIndicator';

function MarketStats() {
  const [data, setData] = useState({
    price: 95000,
    volume: 1250000000,
    marketCap: 1850000000000
  });
  const [previousData, setPreviousData] = useState<typeof data | undefined>(undefined);

  const updateData = (newData: typeof data) => {
    setPreviousData(data);
    setData(newData);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <DataChangeIndicator
        value={data.price}
        previousValue={previousData?.price}
      >
        <div className="stat-card">
          <div className="stat-label">Price</div>
          <div className="stat-value">${data.price.toLocaleString()}</div>
        </div>
      </DataChangeIndicator>

      <DataChangeIndicator
        value={data.volume}
        previousValue={previousData?.volume}
      >
        <div className="stat-card">
          <div className="stat-label">Volume</div>
          <div className="stat-value">${(data.volume / 1e9).toFixed(2)}B</div>
        </div>
      </DataChangeIndicator>

      <DataChangeIndicator
        value={data.marketCap}
        previousValue={previousData?.marketCap}
      >
        <div className="stat-card">
          <div className="stat-label">Market Cap</div>
          <div className="stat-value">${(data.marketCap / 1e12).toFixed(2)}T</div>
        </div>
      </DataChangeIndicator>
    </div>
  );
}
```

### Using the Custom Hook

```tsx
import { useDataChangeTracking } from '@/components/Einstein/DataChangeIndicator';

function TradeSignalDisplay() {
  const [signal, setSignal] = useState({
    entry: 94500,
    stopLoss: 93000,
    tp1: 96000,
    tp2: 97500,
    tp3: 99000
  });

  const changeState = useDataChangeTracking(signal);

  return (
    <div>
      {/* Show which fields changed */}
      {changeState.isAnyChanged && (
        <div className="mb-4">
          <span className="text-bitcoin-orange font-bold">
            Updated: {Array.from(changeState.changedKeys).join(', ')}
          </span>
        </div>
      )}

      {/* Display values with change indicators */}
      {Object.entries(changeState.currentData).map(([key, value]) => (
        <div
          key={key}
          className={`
            stat-card
            ${changeState.changedKeys.has(key) ? 'border-bitcoin-orange shadow-[0_0_20px_rgba(247,147,26,0.5)]' : ''}
          `}
        >
          <div className="stat-label">{key}</div>
          <div className="stat-value">${value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### DataChangeIndicator Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | Required | Current value to display |
| `previousValue` | `any` | `undefined` | Previous value for comparison |
| `children` | `React.ReactNode` | Required | Content to wrap with change indicator |
| `className` | `string` | `''` | Additional CSS classes |
| `showBadge` | `boolean` | `true` | Show "Updated" badge on change |
| `glowDuration` | `number` | `3000` | Duration of glow effect in milliseconds |

### useDataChangeTracking Hook

```tsx
function useDataChangeTracking<T extends Record<string, any>>(
  data: T
): DataChangeState<T>
```

**Returns:**
```tsx
interface DataChangeState<T> {
  currentData: T;              // Current data object
  previousData?: T;            // Previous data object
  changedKeys: Set<string>;    // Set of keys that changed
  isAnyChanged: boolean;       // True if any key changed
}
```

## CSS Animations

The component uses the following CSS animations defined in `styles/globals.css`:

### Animation Keyframes

- **`data-change`**: Orange glow pulse effect (0.5s)
- **`fade-in`**: Fade in with slide up (0.3s)
- **`fade-out`**: Fade out with scale down (0.5s)
- **`glow-pulse`**: Continuous glow pulse (2s infinite)
- **`highlight-flash`**: Quick background flash (0.6s)
- **`badge-slide-in`**: Badge slide in from right (0.4s)
- **`value-change`**: Color transition for values (1s)
- **`shimmer`**: Loading shimmer effect (2s infinite)

### Utility Classes

- **`.animate-data-change`**: Apply data change animation
- **`.animate-fade-in`**: Apply fade in animation
- **`.animate-fade-out`**: Apply fade out animation
- **`.animate-glow-pulse`**: Apply continuous glow pulse
- **`.data-changed-glow`**: Static orange glow effect
- **`.data-changed-text`**: Orange text with glow
- **`.updated-badge`**: Base style for "Updated" badge
- **`.updated-badge-animated`**: Animated "Updated" badge

## Styling

The component follows the Bitcoin Sovereign design system:

- **Orange Glow**: `rgba(247, 147, 26, 0.5)` - 50% opacity orange
- **Badge Background**: `#F7931A` - Bitcoin Orange
- **Badge Text**: `#000000` - Pure Black
- **Border**: `#F7931A` - Bitcoin Orange
- **Shadow**: `0 0 20px rgba(247, 147, 26, 0.5)` - Orange glow

## Accessibility

### Reduced Motion Support

The component respects the `prefers-reduced-motion` user preference:

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations are disabled */
  /* Visual indicators remain but without motion */
}
```

### High Contrast Mode

Enhanced visibility in high contrast mode:

```css
@media (prefers-contrast: high) {
  /* Stronger glow effects */
  /* Thicker borders */
  /* Bolder text */
}
```

### Keyboard Navigation

The component maintains focus states and doesn't interfere with keyboard navigation.

## Performance

### Mobile Optimizations

- Reduced animation duration on mobile (0.4s vs 0.5s)
- Smaller glow effects to reduce GPU load
- Smaller badge size for better mobile UX

### GPU Acceleration

All animations use GPU-accelerated properties:
- `transform` (scale, translate)
- `opacity`
- `box-shadow` (with caution)

## Examples

See `DataChangeIndicator.example.tsx` for comprehensive examples including:

1. Single value change detection
2. Multiple values with wrapper
3. Using custom hook
4. Glow only (no badge)
5. Custom glow duration

## Integration with Einstein Trade Engine

### Refresh Button Integration

```tsx
import DataChangeIndicator from '@/components/Einstein/DataChangeIndicator';
import { RefreshButton } from '@/components/Einstein/RefreshButton';

function TradeSignalCard() {
  const [signal, setSignal] = useState(initialSignal);
  const [previousSignal, setPreviousSignal] = useState<typeof signal | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPreviousSignal(signal);
    
    const newSignal = await fetchUpdatedSignal();
    setSignal(newSignal);
    
    setIsRefreshing(false);
  };

  return (
    <div className="bitcoin-block">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-bitcoin-white">Trade Signal</h3>
        <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
      </div>

      <DataChangeIndicator
        value={signal}
        previousValue={previousSignal}
      >
        <TradeSignalDisplay signal={signal} />
      </DataChangeIndicator>
    </div>
  );
}
```

### Data Quality Badge Integration

```tsx
import DataChangeIndicator from '@/components/Einstein/DataChangeIndicator';
import DataQualityBadge from '@/components/Einstein/DataQualityBadge';

function DataQualityDisplay() {
  const [quality, setQuality] = useState(100);
  const [previousQuality, setPreviousQuality] = useState<number | undefined>(undefined);

  return (
    <DataChangeIndicator
      value={quality}
      previousValue={previousQuality}
      showBadge={true}
    >
      <DataQualityBadge quality={quality} showText={true} />
    </DataChangeIndicator>
  );
}
```

## Best Practices

1. **Always track previous values**: Store the previous value before updating to enable change detection
2. **Use appropriate glow duration**: 3 seconds is optimal for most use cases
3. **Disable badge for subtle changes**: Use `showBadge={false}` for minor updates
4. **Group related changes**: Use the custom hook for objects with multiple properties
5. **Test on mobile**: Ensure animations perform well on mobile devices
6. **Respect user preferences**: The component automatically respects reduced motion preferences

## Troubleshooting

### Badge not showing

- Ensure `showBadge={true}` is set
- Verify `previousValue` is different from `value`
- Check that the component is re-rendering when values change

### Glow effect not visible

- Verify CSS animations are loaded from `styles/globals.css`
- Check that the parent container doesn't have `overflow: hidden`
- Ensure the component has enough space for the glow effect

### Animation not fading

- Confirm `glowDuration` is set correctly
- Check browser console for JavaScript errors
- Verify React state is updating properly

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## License

Part of the Einstein Trade Engine - Bitcoin Sovereign Technology

---

**Status**: ✅ Complete  
**Requirements**: 13.3  
**Last Updated**: January 27, 2025
