# ExecutionStatusBadge Component

## Overview

The `ExecutionStatusBadge` component displays the execution status of trade signals in the Einstein 100000x Trade Generation Engine. It provides clear visual indicators with appropriate color coding and animations to help traders quickly understand the state of their trades.

## Requirements

**Validates**: Requirements 15.1 (Visual Status Indicators and Badges)

**Related Requirements**:
- 14.1: Trade status tracking (PENDING, EXECUTED, CLOSED)
- 14.2: Execution timestamp display
- 14.3: Real-time status updates

## Features

- ✅ **Status-based color coding** (Bitcoin Sovereign compliant)
- ✅ **Pulsing animation** for PENDING status
- ✅ **Execution timestamp** display for EXECUTED trades
- ✅ **Icon indicators** for quick visual recognition
- ✅ **Responsive design** for mobile and desktop
- ✅ **TypeScript support** with full type safety

## Status Types

### PENDING (Orange)
- **Color**: Orange border with black background
- **Animation**: Pulsing (subtle opacity change)
- **Icon**: ⏳ (hourglass)
- **Use**: Trade approved but not yet executed

### EXECUTED (Orange/Black)
- **Color**: Solid orange background with black text
- **Animation**: None
- **Icon**: ✓ (checkmark)
- **Use**: Trade has been executed
- **Extra**: Shows execution timestamp

### PARTIAL_CLOSE (Orange)
- **Color**: Orange border with black background
- **Animation**: None
- **Icon**: ◐ (half-circle)
- **Use**: Some targets hit, trade partially closed

### CLOSED (Gray)
- **Color**: Gray border with black background
- **Animation**: None
- **Icon**: ■ (square)
- **Use**: Trade fully closed

## Usage

### Basic Usage

```tsx
import ExecutionStatusBadge from '@/components/Einstein/ExecutionStatusBadge';

// PENDING status
<ExecutionStatusBadge status="PENDING" />

// EXECUTED status with timestamp
<ExecutionStatusBadge 
  status="EXECUTED" 
  executedAt="2025-01-27T10:30:00Z" 
/>

// PARTIAL_CLOSE status
<ExecutionStatusBadge status="PARTIAL_CLOSE" />

// CLOSED status
<ExecutionStatusBadge status="CLOSED" />
```

### In Trade Card

```tsx
<div className="bitcoin-block">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-bitcoin-white font-bold">BTC/USD LONG</h3>
      <p className="text-sm text-gray-400">Entry: $95,000</p>
    </div>
    <ExecutionStatusBadge 
      status="EXECUTED" 
      executedAt={trade.executedAt} 
    />
  </div>
</div>
```

### In Trade History List

```tsx
{trades.map(trade => (
  <div key={trade.id} className="bitcoin-block-subtle mb-4">
    <div className="flex items-center justify-between mb-2">
      <span className="font-mono text-bitcoin-orange">
        {trade.symbol}
      </span>
      <ExecutionStatusBadge 
        status={trade.status} 
        executedAt={trade.executedAt}
      />
    </div>
    {/* Trade details */}
  </div>
))}
```

## Props

### ExecutionStatusBadgeProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `status` | `ExecutionStatus` | Yes | - | Current execution status |
| `executedAt` | `string` | No | - | ISO timestamp of execution |
| `className` | `string` | No | `''` | Additional CSS classes |

### ExecutionStatus Type

```typescript
type ExecutionStatus = 'PENDING' | 'EXECUTED' | 'PARTIAL_CLOSE' | 'CLOSED';
```

## Styling

The component follows the **Bitcoin Sovereign Technology** design system:

- **Colors**: Black (#000000), Orange (#F7931A), White (#FFFFFF)
- **Typography**: Inter font family, bold uppercase labels
- **Borders**: 2px solid borders for emphasis
- **Animations**: Subtle pulsing for PENDING status
- **Spacing**: Consistent padding and gaps

### Custom Styling

You can add custom classes via the `className` prop:

```tsx
<ExecutionStatusBadge 
  status="PENDING" 
  className="ml-4 shadow-bitcoin-glow"
/>
```

## Animation

The PENDING status includes a subtle pulsing animation defined in `globals.css`:

```css
@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}
```

## Accessibility

- ✅ **High contrast**: All text meets WCAG AA standards
- ✅ **Clear labels**: Uppercase text for readability
- ✅ **Icon indicators**: Visual cues for quick recognition
- ✅ **Semantic HTML**: Proper structure for screen readers

## Integration Points

### With Trade Signal Interface

```typescript
interface TradeSignal {
  id: string;
  symbol: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'PARTIAL_CLOSE' | 'CLOSED';
  executionStatus?: {
    executedAt?: string;
    entryPrice?: number;
    // ...
  };
}

// Usage
<ExecutionStatusBadge 
  status={trade.status as ExecutionStatus}
  executedAt={trade.executionStatus?.executedAt}
/>
```

### With Trade History Component

```tsx
import ExecutionStatusBadge from './ExecutionStatusBadge';

export const EinsteinTradeHistory: React.FC = () => {
  const { trades } = useTradeHistory();
  
  return (
    <div className="space-y-4">
      {trades.map(trade => (
        <div key={trade.id} className="bitcoin-block">
          <ExecutionStatusBadge 
            status={trade.status}
            executedAt={trade.executedAt}
          />
          {/* Trade details */}
        </div>
      ))}
    </div>
  );
};
```

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import ExecutionStatusBadge from './ExecutionStatusBadge';

describe('ExecutionStatusBadge', () => {
  it('renders PENDING status with pulsing animation', () => {
    render(<ExecutionStatusBadge status="PENDING" />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('renders EXECUTED status with timestamp', () => {
    const timestamp = '2025-01-27T10:30:00Z';
    render(<ExecutionStatusBadge status="EXECUTED" executedAt={timestamp} />);
    expect(screen.getByText('EXECUTED')).toBeInTheDocument();
    expect(screen.getByText(/Executed:/)).toBeInTheDocument();
  });

  it('renders CLOSED status with gray styling', () => {
    render(<ExecutionStatusBadge status="CLOSED" />);
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
    expect(screen.getByText('■')).toBeInTheDocument();
  });
});
```

## Examples

See `ExecutionStatusBadge.example.tsx` for complete usage examples.

## Related Components

- `EinsteinTradeHistory.tsx` - Trade history display
- `EinsteinAnalysisModal.tsx` - Trade analysis modal
- `DataQualityBadge.tsx` - Data quality indicator
- `PLIndicator.tsx` - Profit/loss indicator

## Version History

- **v1.0.0** (2025-01-27): Initial implementation
  - PENDING, EXECUTED, PARTIAL_CLOSE, CLOSED statuses
  - Pulsing animation for PENDING
  - Execution timestamp display
  - Bitcoin Sovereign styling

## Support

For issues or questions, refer to:
- Einstein Trade Engine Design Document
- Bitcoin Sovereign Design System
- Component Integration Guide
