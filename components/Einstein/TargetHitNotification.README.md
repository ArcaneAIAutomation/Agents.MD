# Target Hit Notification System

## Overview

The Target Hit Notification System automatically detects when take-profit (TP1, TP2, TP3) or stop-loss targets are hit for executed trades. It displays notifications to users and allows them to mark partial closes with custom percentages.

**Requirements**: 14.4, 16.4

## Features

- ✅ **Automatic Detection**: Monitors executed trades every 30 seconds for target hits
- ✅ **Real-Time Notifications**: Displays notifications when targets are reached
- ✅ **Partial Close Recording**: Allows users to mark partial closes with custom percentages
- ✅ **Multiple Notifications**: Shows up to 3 notifications simultaneously
- ✅ **Auto-Dismiss**: Notifications automatically close after recording a partial close
- ✅ **Manual Dismiss**: Users can ignore notifications without taking action
- ✅ **Bitcoin Sovereign Styling**: Consistent black, orange, and white design

## Components

### 1. TargetHitNotification Component

**Location**: `components/Einstein/TargetHitNotification.tsx`

A notification card that displays when a target is hit.

**Props**:
```typescript
interface TargetHitNotificationProps {
  tradeId: string;                    // Unique trade identifier
  symbol: string;                     // Trading symbol (e.g., 'BTC')
  positionType: 'LONG' | 'SHORT';     // Position direction
  currentPrice: number;               // Current market price
  targetHit: 'TP1' | 'TP2' | 'TP3' | 'STOP_LOSS'; // Which target was hit
  targetPrice: number;                // Target price that was hit
  message: string;                    // Notification message
  onClose: () => void;                // Callback when notification is closed
  onMarkPartialClose: (              // Callback to record partial close
    tradeId: string,
    exitPrice: number,
    percentage: number,
    target: string
  ) => Promise<void>;
  className?: string;                 // Optional CSS classes
}
```

**Usage**:
```tsx
<TargetHitNotification
  tradeId="trade-123"
  symbol="BTC"
  positionType="LONG"
  currentPrice={97500}
  targetHit="TP1"
  targetPrice={97000}
  message="🎯 TP1 hit at 97500.00! Consider taking partial profit."
  onClose={() => dismissNotification('notification-id')}
  onMarkPartialClose={markPartialClose}
/>
```

### 2. useTargetHitNotifications Hook

**Location**: `hooks/useTargetHitNotifications.ts`

A React hook that manages target hit detection and notifications.

**Parameters**:
```typescript
interface UseTargetHitNotificationsOptions {
  checkInterval?: number;      // Check interval in ms (default: 30000)
  autoCheck?: boolean;          // Auto-check enabled (default: true)
  maxNotifications?: number;    // Max notifications shown (default: 3)
}
```

**Returns**:
```typescript
{
  notifications: TargetHitNotification[];  // Active notifications
  checking: boolean;                       // Whether currently checking
  checkTargetsHit: () => Promise<void>;    // Manual check function
  markPartialClose: (                      // Record partial close
    tradeId: string,
    exitPrice: number,
    percentage: number,
    target: string
  ) => Promise<void>;
  dismissNotification: (id: string) => void;  // Dismiss single notification
  dismissAllNotifications: () => void;        // Dismiss all notifications
}
```

**Usage**:
```tsx
const {
  notifications,
  checking,
  checkTargetsHit,
  markPartialClose,
  dismissNotification,
  dismissAllNotifications
} = useTargetHitNotifications(trades, {
  checkInterval: 30000,  // Check every 30 seconds
  autoCheck: true,       // Enable automatic checking
  maxNotifications: 3    // Show max 3 notifications
});
```

## API Endpoint

### POST /api/einstein/partial-close

Records a partial close of a trade when a target is hit.

**Request Body**:
```json
{
  "tradeId": "trade-123",
  "exitPrice": 97500,
  "percentage": 50,
  "target": "TP1"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Partial close recorded successfully",
  "data": {
    "tradeId": "trade-123",
    "exitPrice": 97500,
    "percentage": 50,
    "target": "TP1"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Percentage must be between 1 and 100"
}
```

## Integration Guide

### Step 1: Import Components and Hook

```tsx
import TargetHitNotification from '../components/Einstein/TargetHitNotification';
import { useTargetHitNotifications } from '../hooks/useTargetHitNotifications';
```

### Step 2: Set Up Hook in Component

```tsx
function EinsteinDashboard() {
  const [trades, setTrades] = useState<TradeSignal[]>([]);

  // Initialize notification system
  const {
    notifications,
    markPartialClose,
    dismissNotification
  } = useTargetHitNotifications(trades, {
    checkInterval: 30000,
    autoCheck: true,
    maxNotifications: 3
  });

  // ... rest of component
}
```

### Step 3: Render Notifications

```tsx
return (
  <div>
    {/* Your dashboard content */}
    
    {/* Render notifications in bottom-right corner */}
    <div className="fixed bottom-4 right-4 space-y-4 z-50">
      {notifications.map(notification => (
        <TargetHitNotification
          key={notification.id}
          tradeId={notification.tradeId}
          symbol={notification.symbol}
          positionType={notification.positionType}
          currentPrice={notification.currentPrice}
          targetHit={notification.targetHit}
          targetPrice={notification.targetPrice}
          message={notification.message}
          onClose={() => dismissNotification(notification.id)}
          onMarkPartialClose={markPartialClose}
        />
      ))}
    </div>
  </div>
);
```

## Notification Flow

### 1. Target Detection

```
Every 30 seconds:
  For each EXECUTED trade:
    1. Fetch current market price
    2. Check if any targets are hit
    3. If target hit:
       - Create notification
       - Display to user
```

### 2. User Actions

**Option A: Mark Partial Close**
```
User clicks "Mark Partial Close":
  1. Show form with exit price and percentage
  2. User adjusts values
  3. User clicks "Record Partial Close"
  4. API call to /api/einstein/partial-close
  5. Update trade status in database
  6. Dismiss notification
  7. Show success message
```

**Option B: Ignore**
```
User clicks "Ignore":
  1. Dismiss notification
  2. No database changes
  3. Notification may reappear on next check
```

### 3. Automatic Status Updates

```
When partial close is recorded:
  1. Add exit price to trade.executionStatus.exitPrices
  2. Calculate total percentage filled
  3. If total >= 100%:
     - Set status to 'CLOSED'
     - Calculate realized P/L
  4. Else:
     - Set status to 'PARTIAL_CLOSE'
     - Keep monitoring for remaining targets
```

## Notification Types

### TP1 Hit (50% allocation)
- **Color**: Orange
- **Icon**: Target
- **Default Percentage**: 50%
- **Message**: "🎯 TP1 hit at $X! Consider taking partial profit."

### TP2 Hit (30% allocation)
- **Color**: Orange
- **Icon**: Target
- **Default Percentage**: 30%
- **Message**: "🎯 TP2 hit at $X! Consider taking partial profit."

### TP3 Hit (20% allocation)
- **Color**: Orange
- **Icon**: Target
- **Default Percentage**: 20%
- **Message**: "🎯 TP3 hit at $X! Consider taking profit on remaining position."

### Stop-Loss Hit (100% allocation)
- **Color**: Red
- **Icon**: Alert Circle
- **Default Percentage**: 100%
- **Message**: "⚠️ Stop-loss hit at $X. Consider closing the position."

## Styling

### Bitcoin Sovereign Design

All notifications follow the Bitcoin Sovereign design system:

- **Background**: Pure black (#000000)
- **Borders**: Bitcoin orange (#F7931A) or red for stop-loss
- **Text**: White with opacity variants
- **Buttons**: Orange with hover effects
- **Shadows**: Orange glow effects

### Responsive Design

- **Desktop**: Fixed position bottom-right, max-width 400px
- **Mobile**: Full-width notifications, stacked vertically
- **Tablet**: Responsive width with proper spacing

## Error Handling

### API Errors
```tsx
try {
  await markPartialClose(tradeId, exitPrice, percentage, target);
} catch (error) {
  // Error displayed in notification
  // User can retry or dismiss
}
```

### Price Fetch Errors
```tsx
if (currentPrice === 0) {
  console.warn('Could not fetch price for symbol');
  // Skip notification for this trade
  continue;
}
```

### Validation Errors
```tsx
if (percentage <= 0 || percentage > 100) {
  throw new Error('Percentage must be between 1 and 100');
}
```

## Testing

### Manual Testing

1. **Create an executed trade** with entry price and targets
2. **Wait for price to hit target** or manually trigger check
3. **Verify notification appears** with correct information
4. **Test partial close** with different percentages
5. **Verify database update** and status change
6. **Test dismiss functionality** without recording

### Automated Testing

```typescript
// Test target detection
test('detects TP1 hit for LONG position', () => {
  const trade = createMockTrade('LONG', 95000, 97000);
  const currentPrice = 97500;
  const status = checkTargetsHit(trade, currentPrice);
  expect(status.tp1Hit).toBe(true);
  expect(status.suggestUpdate).toBe(true);
});

// Test partial close recording
test('records partial close correctly', async () => {
  await recordPartialClose('trade-123', 97500, 50, 'TP1');
  const trade = await fetchTrade('trade-123');
  expect(trade.status).toBe('PARTIAL_CLOSE');
  expect(trade.executionStatus.percentFilled).toBe(50);
});
```

## Performance Considerations

### Optimization Strategies

1. **Batch Price Fetching**: Fetch prices for all symbols in one request
2. **Caching**: Cache prices for 30 seconds to reduce API calls
3. **Debouncing**: Prevent multiple simultaneous checks
4. **Lazy Loading**: Only check trades visible to user

### Resource Usage

- **API Calls**: 1 per symbol per 30 seconds
- **Memory**: ~1KB per notification
- **CPU**: Minimal (background checks)

## Troubleshooting

### Notifications Not Appearing

**Check**:
1. Are there any executed trades?
2. Is autoCheck enabled?
3. Are targets actually hit?
4. Check browser console for errors

### Partial Close Fails

**Check**:
1. Is trade ID valid?
2. Is exit price > 0?
3. Is percentage between 1-100?
4. Check API endpoint logs

### Price Fetch Errors

**Check**:
1. Is CoinGecko API accessible?
2. Is symbol mapping correct?
3. Check network connectivity
4. Verify API rate limits

## Future Enhancements

- [ ] **WebSocket Integration**: Real-time price updates
- [ ] **Push Notifications**: Browser notifications when targets hit
- [ ] **Email Alerts**: Send email when important targets hit
- [ ] **SMS Notifications**: Text message alerts for stop-loss hits
- [ ] **Custom Sounds**: Audio alerts for different target types
- [ ] **Notification History**: View past notifications
- [ ] **Snooze Feature**: Temporarily dismiss notifications
- [ ] **Batch Actions**: Mark multiple partial closes at once

## Related Files

- `lib/einstein/execution/tracker.ts` - Trade execution tracking logic
- `lib/einstein/types.ts` - TypeScript type definitions
- `components/Einstein/EinsteinTradeHistory.tsx` - Trade history display
- `components/Einstein/ExecutionStatusBadge.tsx` - Status badge component
- `components/Einstein/PLIndicator.tsx` - P/L display component

## Support

For issues or questions:
1. Check this README
2. Review example implementation
3. Check console logs for errors
4. Review API endpoint responses
5. Consult Einstein system documentation

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: January 27, 2025  
**Requirements**: 14.4, 16.4
