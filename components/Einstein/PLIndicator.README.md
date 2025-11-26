# PLIndicator Component

## Overview

The `PLIndicator` component displays profit/loss (P/L) for Einstein trade signals with appropriate color coding and icons. It updates in real-time for executed trades and follows the Bitcoin Sovereign design system.

## Requirements

- **Requirements**: 15.3, 15.4
- **Validates**: Requirements 14.3

## Features

- ✅ **Bitcoin Sovereign Design**: Uses orange for profit, white for loss (no green/red)
- ✅ **Real-time Updates**: Displays current P/L for executed trades
- ✅ **Multiple Sizes**: Small, medium, and large variants
- ✅ **Compact Mode**: Single-line display for tables and lists
- ✅ **Icon Support**: Upward/downward arrows for visual clarity
- ✅ **Percentage Display**: Shows both dollar amount and percentage return
- ✅ **Responsive**: Works on mobile, tablet, and desktop

## Color Coding

Following Bitcoin Sovereign design principles (black, orange, white only):

| State | Color | Icon | Usage |
|-------|-------|------|-------|
| **Profit** | Orange (#F7931A) | ↑ | Positive P/L |
| **Loss** | White 80% opacity | ↓ | Negative P/L |

## Usage

### Basic Usage

```tsx
import { PLIndicator } from '@/components/Einstein/PLIndicator';

const pl = {
  profitLoss: 1500.00,
  profitLossPercent: 5.25,
  isProfit: true,
  color: 'green',
  icon: 'up'
};

<PLIndicator pl={pl} />
```

### Size Variants

```tsx
// Small (for compact displays)
<PLIndicator pl={pl} size="sm" />

// Medium (default)
<PLIndicator pl={pl} size="md" />

// Large (for emphasis)
<PLIndicator pl={pl} size="lg" />
```

### Compact Mode

For use in tables or lists where space is limited:

```tsx
import { CompactPLIndicator } from '@/components/Einstein/PLIndicator';

<CompactPLIndicator pl={pl} />
```

### Without Icon

```tsx
<PLIndicator pl={pl} showIcon={false} />
```

### Without Percentage

```tsx
<PLIndicator pl={pl} showPercentage={false} />
```

## Props

### PLIndicator Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pl` | `PLCalculation` | Required | P/L calculation object |
| `showPercentage` | `boolean` | `true` | Show percentage return |
| `showIcon` | `boolean` | `true` | Show arrow icon |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |
| `className` | `string` | `''` | Additional CSS classes |

### CompactPLIndicator Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pl` | `PLCalculation` | Required | P/L calculation object |
| `className` | `string` | `''` | Additional CSS classes |

### PLCalculation Interface

```typescript
interface PLCalculation {
  profitLoss: number;          // Dollar amount (positive or negative)
  profitLossPercent: number;   // Percentage return
  isProfit: boolean;           // True if profit, false if loss
  color: 'green' | 'red';      // Legacy color (mapped to orange/white)
  icon: 'up' | 'down';         // Arrow direction
}
```

## Integration with Trade Execution Tracker

The component is designed to work seamlessly with the `TradeExecutionTracker`:

```tsx
import { tradeExecutionTracker } from '@/lib/einstein/execution/tracker';
import { PLIndicator } from '@/components/Einstein/PLIndicator';

// Calculate unrealized P/L for executed trade
const pl = tradeExecutionTracker.calculateUnrealizedPL(
  trade,
  currentPrice
);

// Display P/L
<PLIndicator pl={pl} />
```

## Real-Time Updates

For real-time P/L updates on executed trades:

```tsx
import { useState, useEffect } from 'react';
import { tradeExecutionTracker } from '@/lib/einstein/execution/tracker';
import { PLIndicator } from '@/components/Einstein/PLIndicator';

function TradeCard({ trade }) {
  const [pl, setPL] = useState<PLCalculation | null>(null);

  useEffect(() => {
    // Only update P/L for executed trades
    if (trade.status !== 'EXECUTED' && trade.status !== 'PARTIAL_CLOSE') {
      return;
    }

    // Update P/L every 30 seconds
    const updatePL = async () => {
      try {
        const currentPrice = await fetchCurrentPrice(trade.symbol);
        const newPL = tradeExecutionTracker.calculateUnrealizedPL(
          trade,
          currentPrice
        );
        setPL(newPL);
      } catch (error) {
        console.error('Failed to update P/L:', error);
      }
    };

    // Initial update
    updatePL();

    // Set up interval
    const interval = setInterval(updatePL, 30000);

    return () => clearInterval(interval);
  }, [trade]);

  if (!pl) return null;

  return (
    <div className="bitcoin-block p-4">
      <h3 className="text-bitcoin-white font-bold mb-2">
        {trade.symbol} {trade.positionType}
      </h3>
      <PLIndicator pl={pl} size="lg" />
    </div>
  );
}
```

## Examples

### Profit Display

```tsx
const profit = {
  profitLoss: 2500.00,
  profitLossPercent: 8.33,
  isProfit: true,
  color: 'green',
  icon: 'up'
};

<PLIndicator pl={profit} />
// Displays: ↑ +$2.50K +8.33% (in orange)
```

### Loss Display

```tsx
const loss = {
  profitLoss: -750.00,
  profitLossPercent: -2.50,
  isProfit: false,
  color: 'red',
  icon: 'down'
};

<PLIndicator pl={loss} />
// Displays: ↓ -$750.00 -2.50% (in white 80%)
```

### Large Profit

```tsx
const largeProfit = {
  profitLoss: 1500000.00,
  profitLossPercent: 15.00,
  isProfit: true,
  color: 'green',
  icon: 'up'
};

<PLIndicator pl={largeProfit} size="lg" />
// Displays: ↑ +$1.50M +15.00% (in orange, large size)
```

## Styling

The component uses Bitcoin Sovereign design system colors:

```css
/* Profit (Orange) */
.text-bitcoin-orange {
  color: #F7931A;
}

.bg-bitcoin-orange-10 {
  background-color: rgba(247, 147, 26, 0.1);
}

.border-bitcoin-orange-20 {
  border-color: rgba(247, 147, 26, 0.2);
}

/* Loss (White 80%) */
.text-bitcoin-white-80 {
  color: rgba(255, 255, 255, 0.8);
}
```

## Accessibility

- ✅ **Color Contrast**: Meets WCAG AA standards
- ✅ **Icon Support**: Visual indicators for profit/loss
- ✅ **Font Size**: Readable at all sizes
- ✅ **Monospace Font**: Clear number display

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { PLIndicator } from '@/components/Einstein/PLIndicator';

describe('PLIndicator', () => {
  it('displays profit correctly', () => {
    const pl = {
      profitLoss: 1000,
      profitLossPercent: 5,
      isProfit: true,
      color: 'green',
      icon: 'up'
    };

    render(<PLIndicator pl={pl} />);
    expect(screen.getByText(/\+\$1\.00K/)).toBeInTheDocument();
    expect(screen.getByText(/\+5\.00%/)).toBeInTheDocument();
  });

  it('displays loss correctly', () => {
    const pl = {
      profitLoss: -500,
      profitLossPercent: -2.5,
      isProfit: false,
      color: 'red',
      icon: 'down'
    };

    render(<PLIndicator pl={pl} />);
    expect(screen.getByText(/-\$500\.00/)).toBeInTheDocument();
    expect(screen.getByText(/-2\.50%/)).toBeInTheDocument();
  });
});
```

## Related Components

- **ExecutionStatusBadge**: Displays trade execution status
- **RefreshButton**: Refreshes trade data and P/L
- **EinsteinTradeHistory**: Displays trade history with P/L
- **DataSourceHealthPanel**: Shows data source status

## Notes

- The component automatically formats large numbers (K for thousands, M for millions)
- Percentage is always displayed with 2 decimal places
- Icon size scales with component size
- Compact mode is recommended for table cells and list items
- Real-time updates should be throttled to avoid excessive API calls (30 seconds recommended)

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025
